import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';

import { AppModule } from '../src/app.module';
import { User } from '../src/modules/users/entities/user.entity';
import { Service, ProviderType, ServiceType } from '../src/modules/services/entities/service.entity';
import { ScheduleSlot } from '../src/modules/services/entities/schedule-slot.entity';
import { ScheduleSlotStatus } from '../src/modules/services/enums/schedule-slot-status.enum';
import { Booking, BookingStatus } from '../src/modules/bookings/entities/booking.entity';

describe('Bookings (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  let student: User;
  let service: Service;
  let slot: ScheduleSlot;
  let token: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );

    await app.init();
    dataSource = app.get(DataSource);
  });

  beforeEach(async () => {
    await dataSource.createQueryBuilder().delete().from('bookings').execute();
    await dataSource.createQueryBuilder().delete().from('schedule_slots').execute();
    await dataSource.createQueryBuilder().delete().from('services').execute();
    await dataSource.createQueryBuilder().delete().from('users').execute();

    const userRepo = dataSource.getRepository(User);
    const serviceRepo = dataSource.getRepository(Service);
    const slotRepo = dataSource.getRepository(ScheduleSlot);

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('123456', salt);

    student = await userRepo.save({
      email: '[email protected]',
      phone: '51999999999',
      passwordHash: passwordHash,
      type: 'ALUNO',
      status: 'ATIVO',
    });

    service = await serviceRepo.save({
      providerType: ProviderType.PERSONAL,
      providerId: student.id,
      unitId: null,
      name: 'Sessão teste',
      description: 'Serviço de teste',
      modality: 'Musculação',
      durationMinutes: 60,
      type: ServiceType.SESSAO,
      price: '50.00',
      currency: 'BRL',
      isActive: true,
    });

    slot = await slotRepo.save({
      serviceId: service.id,
      startsAt: new Date('2026-06-20T10:00:00.000Z'),
      endsAt: new Date('2026-06-20T11:00:00.000Z'),
      status: ScheduleSlotStatus.AVAILABLE,
      studentId: null,
    });

    const loginRes = await request.default(app.getHttpServer())
      .post('/auth/login')
      .send({ email: '[email protected]', password: '123456' })
      .expect(200);

    token = loginRes.body.access_token;
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('deve criar um booking com sucesso', async () => {
    const response = await request.default(app.getHttpServer())
      .post('/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send({
        serviceId: service.id,
        slotId: slot.id,
      })
      .expect(201);

    expect(response.body).toEqual(
      expect.objectContaining({
        serviceId: service.id,
        slotId: slot.id,
        studentId: student.id,
      }),
    );

    expect(response.body.id).toBeDefined();
    expect(response.body.status).toBe('PENDING');
    expect(response.body.checkoutUrl).toContain('sandbox.mercadopago');
  });

  it('deve retornar 404 ao tentar criar booking com slotId inexistente', async () => {
    const fakeSlotId = '00000000-0000-0000-0000-000000000000';
    
    await request.default(app.getHttpServer())
      .post('/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send({
        serviceId: service.id,
        slotId: fakeSlotId,
      })
      .expect(404);
  });

  it('deve retornar 400 ao tentar criar booking para slot não disponível', async () => {
    const slotRepo = dataSource.getRepository(ScheduleSlot);
    slot.status = ScheduleSlotStatus.BOOKED;
    await slotRepo.save(slot);

    await request.default(app.getHttpServer())
      .post('/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send({
        serviceId: service.id,
        slotId: slot.id,
      })
      .expect(400);
  });

  it('deve retornar 409 (conflito) ao tentar criar booking para slot que já possui booking ativo', async () => {
    const bookingRepo = dataSource.getRepository(Booking);
    await bookingRepo.save({
      serviceId: service.id,
      slotId: slot.id,
      studentId: student.id,
      status: BookingStatus.CONFIRMED,
    });

    await request.default(app.getHttpServer())
      .post('/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send({
        serviceId: service.id,
        slotId: slot.id,
      })
      .expect(409);
  });

  it('deve cancelar um booking com sucesso (PATCH /bookings/:id/cancel)', async () => {
    const createRes = await request.default(app.getHttpServer())
      .post('/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send({
        serviceId: service.id,
        slotId: slot.id,
      })
      .expect(201);
      
    const bookingId = createRes.body.id;

    const cancelRes = await request.default(app.getHttpServer())
      .patch(`/bookings/${bookingId}/cancel`)
      .set('Authorization', `Bearer ${token}`)
      .send({})
      .expect(200);

    expect(cancelRes.body.status).toBe('CANCELLED');
    expect(cancelRes.body.cancelledAt).not.toBeNull();

    const slotRepo = dataSource.getRepository(ScheduleSlot);
    const updatedSlot = await slotRepo.findOne({ where: { id: slot.id } });
    expect(updatedSlot?.status).toBe(ScheduleSlotStatus.AVAILABLE);
  });

  it('deve retornar a lista de bookings do aluno (GET /bookings/students/:studentId)', async () => {
    await request.default(app.getHttpServer())
      .post('/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send({
        serviceId: service.id,
        slotId: slot.id,
      })
      .expect(201);

    const listRes = await request.default(app.getHttpServer())
      .get(`/bookings/students/${student.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(Array.isArray(listRes.body)).toBe(true);
    expect(listRes.body.length).toBe(1);
    expect(listRes.body[0].serviceId).toBe(service.id);
    expect(listRes.body[0].slotId).toBe(slot.id);
    expect(listRes.body[0].studentId).toBe(student.id);
  });
});