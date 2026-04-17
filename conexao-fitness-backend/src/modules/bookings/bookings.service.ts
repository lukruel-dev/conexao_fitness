import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Booking } from './entities/booking.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { Service } from '../services/entities/service.entity';
import { ScheduleSlot } from '../services/entities/schedule-slot.entity';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingsRepo: Repository<Booking>,

    @InjectRepository(Service)
    private readonly servicesRepo: Repository<Service>,

    @InjectRepository(ScheduleSlot)
    private readonly slotsRepo: Repository<ScheduleSlot>,

    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateBookingDto): Promise<Booking> {
    return this.dataSource.transaction(async (manager) => {
      const service = await manager.findOne(Service, {
        where: { id: dto.serviceId, isActive: true },
      });

      if (!service) {
        throw new NotFoundException('Service not found or inactive');
      }

      const slot = await manager.findOne(ScheduleSlot, {
        where: { id: dto.slotId, serviceId: dto.serviceId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!slot) {
        throw new NotFoundException('Slot not found for this service');
      }

      if (slot.status !== 'AVAILABLE') {
        throw new BadRequestException('Slot is not available for booking');
      }

      // opcional: verificar se já existe booking para esse slot
      const existing = await manager.findOne(Booking, {
        where: { slotId: dto.slotId, status: 'CONFIRMED' },
      });

      if (existing) {
        throw new BadRequestException('Slot already booked');
      }

      // marca slot como BOOKED
      slot.status = 'BOOKED';
      await manager.save(ScheduleSlot, slot);

      const booking = manager.create(Booking, {
        serviceId: dto.serviceId,
        slotId: dto.slotId,
        studentId: dto.studentId,
        status: 'CONFIRMED',
      });

      return manager.save(Booking, booking);
    });
  }

  async findByStudent(studentId: string): Promise<Booking[]> {
    return this.bookingsRepo.find({
      where: { studentId },
      relations: ['service', 'slot'],
      order: { createdAt: 'DESC' },
    });
  }
}