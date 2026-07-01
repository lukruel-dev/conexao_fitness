import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';

import { Service } from './entities/service.entity';
import { ScheduleSlot } from './entities/schedule-slot.entity';

import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { GetServicesDto } from './dto/get-services.dto';
import { CreateScheduleSlotDto } from './dto/create-schedule-slot.dto';
import { UpdateScheduleSlotDto } from './dto/update-schedule-slot.dto';
import { ScheduleSlotStatus } from './enums/schedule-slot-status.enum';
import { User } from '../users/entities/user.entity';
import { Subscription } from '../payments/entities/subscription.entity';
import { AvailabilityService } from '../availability/availability.service';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(Service)
    private readonly servicesRepo: Repository<Service>,

    @InjectRepository(ScheduleSlot)
    private readonly scheduleSlotsRepo: Repository<ScheduleSlot>,

    private readonly availabilityService: AvailabilityService,
  ) {}

  async create(dto: CreateServiceDto): Promise<Service> {
    const service = this.servicesRepo.create({
      providerType: dto.providerType,
      providerId: dto.providerId,
      unitId: dto.unitId ?? null,
      name: dto.name,
      description: dto.description ?? null,
      modality: dto.modality,
      durationMinutes: dto.durationMinutes,
      type: dto.type,
      price: dto.price,
      currency: dto.currency ?? 'BRL',
      isActive: dto.isActive ?? true,
    });

    return this.servicesRepo.save(service);
  }

  async findAll(query?: GetServicesDto): Promise<any[]> {
    const qb = this.servicesRepo.createQueryBuilder('service');
    qb.leftJoin(User, 'provider', 'provider.id = service.providerId');
    qb.leftJoin(Subscription, 'subscription', "subscription.userId = provider.id AND subscription.status = 'ACTIVE'");
    
    if (query?.q) {
      qb.andWhere(
        '(service.name ILIKE :q OR service.description ILIKE :q OR service.modality ILIKE :q)',
        { q: `%${query.q}%` },
      );
    }
    
    if (query?.modality) {
      qb.andWhere('service.modality ILIKE :modality', { modality: query.modality });
    }
    
    if (query?.providerType) {
      qb.andWhere('service.providerType = :providerType', { providerType: query.providerType });
    }

    qb.andWhere('service.isActive = true');
    
    // Default boost logic
    qb.addSelect(
      `CASE WHEN provider.cityBase ILIKE '%uruguaiana%' THEN 1000 ELSE 0 END`,
      'uruguaianaBoost'
    );
    
    // Premium boost
    qb.addSelect(
      `CASE WHEN subscription.id IS NOT NULL THEN 500 ELSE 0 END`,
      'premiumBoost'
    );
    
    // Select Provider rating fields
    qb.addSelect('provider.averageRating', 'averageRating');
    qb.addSelect('provider.totalReviews', 'totalReviews');

    if (query?.lat !== undefined && query?.lng !== undefined) {
      const haversine = `(6371 * acos(cos(radians(:lat)) * cos(radians(provider.lastLat)) * cos(radians(provider.lastLng) - radians(:lng)) + sin(radians(:lat)) * sin(radians(provider.lastLat))))`;
      
      qb.addSelect(haversine, 'distance');
      qb.setParameter('lat', query.lat);
      qb.setParameter('lng', query.lng);

      if (query?.radiusKm !== undefined) {
        qb.andWhere(`${haversine} <= :radiusKm`, { radiusKm: query.radiusKm });
      }

      // Hack for raw orderBy alias issue in some TypeORM versions: wrap in quotes or use custom literal
      qb.orderBy('"uruguaianaBoost"', 'DESC');
      qb.addOrderBy('"premiumBoost"', 'DESC');
      qb.addOrderBy('"averageRating"', 'DESC');
      qb.addOrderBy('distance', 'ASC');
    } else {
      qb.orderBy('"uruguaianaBoost"', 'DESC');
      qb.addOrderBy('"premiumBoost"', 'DESC');
      qb.addOrderBy('"averageRating"', 'DESC');
      qb.addOrderBy('service.createdAt', 'DESC');
    }
    
    const { entities, raw } = await qb.getRawAndEntities();

    return entities.map((entity, index) => {
      const rawData = raw[index];
      const uruguaiana = rawData.uruguaianaBoost ? parseInt(rawData.uruguaianaBoost, 10) : 0;
      const premium = rawData.premiumBoost ? parseInt(rawData.premiumBoost, 10) : 0;
      
      return {
        ...entity,
        distance: rawData.distance ? parseFloat(rawData.distance) : null,
        boostScore: uruguaiana + premium,
        isPremium: premium > 0,
        providerRating: rawData.averageRating ? parseFloat(rawData.averageRating) : 5.0,
        totalReviews: rawData.totalReviews ? parseInt(rawData.totalReviews, 10) : 0,
      };
    });
  }

  async findOne(id: string): Promise<Service | null> {
    return this.servicesRepo.findOne({
      where: { id },
      relations: ['slots'],
    });
  }

  async findOneOrFail(id: string): Promise<Service> {
    const service = await this.findOne(id);

    if (!service || !service.isActive) {
      throw new NotFoundException('Service not found or inactive');
    }

    return service;
  }

  async update(id: string, dto: UpdateServiceDto): Promise<Service> {
    await this.findOneOrFail(id);

    await this.servicesRepo.update(id, {
      providerType: dto.providerType,
      providerId: dto.providerId,
      unitId: dto.unitId,
      name: dto.name,
      description: dto.description,
      modality: dto.modality,
      durationMinutes: dto.durationMinutes,
      type: dto.type,
      price: dto.price,
      currency: dto.currency,
      isActive: dto.isActive,
    });

    return this.findOneOrFail(id);
  }

  async remove(id: string): Promise<void> {
    const result = await this.servicesRepo.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException('Service not found');
    }
  }

async createScheduleSlotForService(
  serviceId: string,
  dto: CreateScheduleSlotDto,
): Promise<ScheduleSlot> {
  await this.findOneOrFail(serviceId);

  const startsAt = new Date(dto.startsAt);
  const endsAt = new Date(dto.endsAt);

  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
    throw new BadRequestException('Invalid startsAt or endsAt');
  }

  if (startsAt >= endsAt) {
    throw new BadRequestException('startsAt must be before endsAt');
  }

  const overlappingSlot = await this.scheduleSlotsRepo
    .createQueryBuilder('slot')
    .where('slot.serviceId = :serviceId', { serviceId })
    .andWhere('slot.startsAt < :endsAt', { endsAt })
    .andWhere('slot.endsAt > :startsAt', { startsAt })
    .getOne();

  if (overlappingSlot) {
    throw new ConflictException(
      'There is already a slot overlapping this time range',
    );
  }

  const slot = new ScheduleSlot();
  slot.serviceId = serviceId;
  slot.startsAt = startsAt;
  slot.endsAt = endsAt;
  slot.status = dto.status ?? ScheduleSlotStatus.AVAILABLE;
  slot.studentId = dto.studentId ?? null;

  return await this.scheduleSlotsRepo.save(slot);
}

  async listScheduleSlotsForService(
    serviceId: string,
    query?: any,
  ): Promise<ScheduleSlot[]> {
    await this.findOneOrFail(serviceId);

    const from = query?.from ? new Date(query.from) : new Date();
    const to = query?.to
      ? new Date(query.to)
      : new Date(from.getTime() + 14 * 24 * 60 * 60 * 1000);

    return this.scheduleSlotsRepo.find({
      where: {
        serviceId,
        startsAt: Between(from, to),
      },
      order: { startsAt: 'ASC' },
    });
  }

async updateScheduleSlot(
  slotId: string,
  dto: UpdateScheduleSlotDto,
): Promise<ScheduleSlot> {
  const slot = await this.scheduleSlotsRepo.findOne({
    where: { id: slotId },
  });

  if (!slot) {
    throw new NotFoundException('Schedule slot not found');
  }

  const startsAt = dto.startsAt ? new Date(dto.startsAt) : slot.startsAt;
  const endsAt = dto.endsAt ? new Date(dto.endsAt) : slot.endsAt;

  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
    throw new BadRequestException('Invalid startsAt or endsAt');
  }

  if (startsAt >= endsAt) {
    throw new BadRequestException('startsAt must be before endsAt');
  }

  const overlappingSlot = await this.scheduleSlotsRepo
    .createQueryBuilder('slot')
    .where('slot.serviceId = :serviceId', { serviceId: slot.serviceId })
    .andWhere('slot.id != :slotId', { slotId })
    .andWhere('slot.startsAt < :endsAt', { endsAt })
    .andWhere('slot.endsAt > :startsAt', { startsAt })
    .getOne();

  if (overlappingSlot) {
    throw new ConflictException(
      'There is already a slot overlapping this time range',
    );
  }

  slot.startsAt = startsAt;
  slot.endsAt = endsAt;
  slot.status = dto.status ?? slot.status;
  slot.studentId =
    dto.studentId !== undefined ? dto.studentId ?? null : slot.studentId;

  return await this.scheduleSlotsRepo.save(slot);
}
  async deleteScheduleSlot(slotId: string): Promise<void> {
    const result = await this.scheduleSlotsRepo.delete(slotId);

    if (result.affected === 0) {
      throw new NotFoundException('Schedule slot not found');
    }
  }

  async generateSlotsForService(serviceId: string, daysAhead: number = 30): Promise<{ createdCount: number }> {
    const service = await this.findOneOrFail(serviceId);
    
    // Pegar disponibilidade do professor
    const availabilities = await this.availabilityService.getAvailability(service.providerId);
    
    if (availabilities.length === 0) {
      throw new BadRequestException('Provider has no availability schedule defined');
    }

    let createdCount = 0;
    const now = new Date();
    // Normalizar 'agora' para pegar slots apenas no futuro
    
    for (let dayOffset = 0; dayOffset <= daysAhead; dayOffset++) {
      const targetDate = new Date();
      targetDate.setDate(now.getDate() + dayOffset);
      const dayOfWeek = targetDate.getDay(); // 0 = Sunday, 1 = Monday, etc.

      // Encontrar regras de disponibilidade para este dia da semana
      const rulesForDay = availabilities.filter(a => a.dayOfWeek === dayOfWeek);

      for (const rule of rulesForDay) {
        // rule.startTime = "08:00"
        const [startHour, startMinute] = rule.startTime.split(':').map(Number);
        const [endHour, endMinute] = rule.endTime.split(':').map(Number);

        let currentSlotStart = new Date(targetDate);
        currentSlotStart.setHours(startHour, startMinute, 0, 0);

        const ruleEnd = new Date(targetDate);
        ruleEnd.setHours(endHour, endMinute, 0, 0);

        // Slice by service duration
        while (currentSlotStart < ruleEnd) {
          const currentSlotEnd = new Date(currentSlotStart.getTime() + service.durationMinutes * 60000);

          if (currentSlotEnd > ruleEnd) {
            break; // slot ultrapassa o horario de termino
          }

          if (currentSlotStart > now) {
            // Check overlaps
            const overlappingSlot = await this.scheduleSlotsRepo
              .createQueryBuilder('slot')
              .where('slot.serviceId = :serviceId', { serviceId })
              .andWhere('slot.startsAt < :endsAt', { endsAt: currentSlotEnd })
              .andWhere('slot.endsAt > :startsAt', { startsAt: currentSlotStart })
              .getOne();

            if (!overlappingSlot) {
              const slot = new ScheduleSlot();
              slot.serviceId = serviceId;
              slot.startsAt = currentSlotStart;
              slot.endsAt = currentSlotEnd;
              slot.status = ScheduleSlotStatus.AVAILABLE;
              
              await this.scheduleSlotsRepo.save(slot);
              createdCount++;
            }
          }

          // Avançar
          currentSlotStart = currentSlotEnd;
        }
      }
    }

    return { createdCount };
  }
}