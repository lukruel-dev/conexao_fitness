import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Service } from './entities/service.entity';
import { ScheduleSlot } from './entities/schedule-slot.entity';

import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { CreateScheduleSlotDto } from './dto/create-schedule-slot.dto';
import { UpdateScheduleSlotDto } from './dto/update-schedule-slot.dto';
import { ScheduleSlotStatus } from './enums/schedule-slot-status.enum';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(Service)
    private readonly servicesRepo: Repository<Service>,

    @InjectRepository(ScheduleSlot)
    private readonly scheduleSlotsRepo: Repository<ScheduleSlot>,
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

  async findAll(): Promise<Service[]> {
    return this.servicesRepo.find({
      order: { createdAt: 'DESC' },
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

    if (!service) {
      throw new NotFoundException('Service not found');
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

  async listScheduleSlotsForService(serviceId: string): Promise<ScheduleSlot[]> {
    await this.findOneOrFail(serviceId);

    return this.scheduleSlotsRepo.find({
      where: { serviceId },
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
}