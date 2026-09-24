import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MembershipsService } from './memberships.service';
import { MembershipPlan } from './entities/membership-plan.entity';
import { EnrollmentStatus, GymEnrollment } from './entities/gym-enrollment.entity';
import { AccessStatus, GymAccessLog } from './entities/gym-access-log.entity';
import { User } from '../users/entities/user.entity';
import { Subscription, SubscriptionStatus } from '../payments/entities/subscription.entity';
import { Service } from '../services/entities/service.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { WalletService } from '../wallet/wallet.service';

describe('MembershipsService - validateAccess', () => {
  let service: MembershipsService;
  let mockPlanRepo: any;
  let mockEnrollmentRepo: any;
  let mockAccessLogRepo: any;
  let mockUserRepo: any;
  let mockSubscriptionRepo: any;
  let mockServiceRepo: any;
  let mockNotificationsService: any;
  let mockWalletService: any;

  const academiaId = 'a1111111-2222-3333-4444-555555555555';
  const otherAcademiaId = 'b9999999-8888-7777-6666-555555555555';
  const studentId = 'c1111111-2222-3333-4444-555555555555';

  beforeEach(async () => {
    mockPlanRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
    };

    mockEnrollmentRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    mockAccessLogRepo = {
      findOne: jest.fn(),
      save: jest.fn().mockImplementation((log) => Promise.resolve({ id: 'log-123', ...log })),
      create: jest.fn().mockImplementation((dto) => ({ ...dto })),
    };

    const mockUserQb: any = {
      where: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(null),
    };

    mockUserRepo = {
      findOne: jest.fn().mockResolvedValue({ id: academiaId, name: 'Academia Matriz' }),
      findOneBy: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(mockUserQb),
    };

    mockSubscriptionRepo = {
      findOne: jest.fn().mockResolvedValue({
        userId: academiaId,
        status: SubscriptionStatus.ACTIVE,
        planName: 'Essencial',
      }),
    };

    mockServiceRepo = {
      findOne: jest.fn().mockResolvedValue(null),
    };

    mockNotificationsService = {
      createNotification: jest.fn().mockResolvedValue({}),
    };

    mockWalletService = {
      getMyBalance: jest.fn().mockResolvedValue({ current_balance: 50.0 }),
      deductBalance: jest.fn().mockResolvedValue(25.0),
      addBalance: jest.fn().mockResolvedValue(100.0),
      recordTransaction: jest.fn().mockResolvedValue({}),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MembershipsService,
        { provide: getRepositoryToken(MembershipPlan), useValue: mockPlanRepo },
        { provide: getRepositoryToken(GymEnrollment), useValue: mockEnrollmentRepo },
        { provide: getRepositoryToken(GymAccessLog), useValue: mockAccessLogRepo },
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
        { provide: getRepositoryToken(Subscription), useValue: mockSubscriptionRepo },
        { provide: getRepositoryToken(Service), useValue: mockServiceRepo },
        { provide: NotificationsService, useValue: mockNotificationsService },
        { provide: WalletService, useValue: mockWalletService },
      ],
    }).compile();

    service = module.get<MembershipsService>(MembershipsService);
  });

  it('deve liberar acesso para matrícula válida e ativa', async () => {
    const validEndDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
    const mockEnrollment = {
      id: 'enr-1',
      academiaId,
      studentId,
      planName: 'Plano Mensal',
      startDate: new Date(),
      endDate: validEndDate,
      status: EnrollmentStatus.ACTIVE,
      qrAccessCode: 'CF-ACAD-TEST1234',
      student: { id: studentId, name: 'Carlos Silva', email: 'carlos@test.com' },
    };

    const qbMock: any = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(mockEnrollment),
    };
    mockEnrollmentRepo.createQueryBuilder.mockReturnValue(qbMock);
    mockAccessLogRepo.findOne.mockResolvedValue(null); // Sem acesso recente nos 15 min

    const result = await service.validateAccess(academiaId, {
      qrCode: 'CF-ACAD-TEST1234',
    });

    expect(result.granted).toBe(true);
    expect(result.message).toContain('Acesso Liberado');
    expect(result.enrollment?.status).toBe(EnrollmentStatus.ACTIVE);
  });

  it('deve negar acesso quando a matrícula estiver vencida', async () => {
    const expiredEndDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    const mockEnrollment = {
      id: 'enr-exp',
      academiaId,
      studentId,
      planName: 'Plano Mensal',
      startDate: new Date(Date.now() - 32 * 24 * 60 * 60 * 1000),
      endDate: expiredEndDate,
      status: EnrollmentStatus.ACTIVE,
      qrAccessCode: 'CF-ACAD-EXPIRED',
      student: { id: studentId, name: 'Mariana Lima', email: 'mariana@test.com' },
    };

    const qbMock: any = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(mockEnrollment),
    };
    mockEnrollmentRepo.createQueryBuilder.mockReturnValue(qbMock);

    const result = await service.validateAccess(academiaId, {
      qrCode: 'CF-ACAD-EXPIRED',
    });

    expect(result.granted).toBe(false);
    expect(result.canChargeDayPass).toBe(true);
    expect(result.message).toContain('Acesso Negado: Matrícula venceu');
  });

  it('deve negar acesso quando o QR code for reutilizado em menos de 15 minutos (anti-passback)', async () => {
    const validEndDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
    const mockEnrollment = {
      id: 'enr-1',
      academiaId,
      studentId,
      planName: 'Plano Mensal',
      startDate: new Date(),
      endDate: validEndDate,
      status: EnrollmentStatus.ACTIVE,
      qrAccessCode: 'CF-ACAD-PASSBACK',
      student: { id: studentId, name: 'Lucas Passback', email: 'lucas@test.com' },
    };

    const qbMock: any = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(mockEnrollment),
    };
    mockEnrollmentRepo.createQueryBuilder.mockReturnValue(qbMock);

    // Simula um acesso liberado há 2 minutos
    mockAccessLogRepo.findOne.mockResolvedValue({
      id: 'log-prev',
      academiaId,
      studentId,
      status: AccessStatus.GRANTED,
      accessedAt: new Date(Date.now() - 2 * 60 * 1000),
    });

    const result = await service.validateAccess(academiaId, {
      qrCode: 'CF-ACAD-PASSBACK',
      bypassAntiPassback: false,
    });

    expect(result.granted).toBe(false);
    expect(result.reason).toContain('Anti-passback');
    expect(result.message).toContain('Anti-passback');
  });

  it('deve liberar acesso se o anti-passback for deliberadamente ignorado (bypassAntiPassback: true)', async () => {
    const validEndDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
    const mockEnrollment = {
      id: 'enr-1',
      academiaId,
      studentId,
      planName: 'Plano Mensal',
      startDate: new Date(),
      endDate: validEndDate,
      status: EnrollmentStatus.ACTIVE,
      qrAccessCode: 'CF-ACAD-PASSBACK',
      student: { id: studentId, name: 'Lucas Passback', email: 'lucas@test.com' },
    };

    const qbMock: any = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(mockEnrollment),
    };
    mockEnrollmentRepo.createQueryBuilder.mockReturnValue(qbMock);

    const result = await service.validateAccess(academiaId, {
      qrCode: 'CF-ACAD-PASSBACK',
      bypassAntiPassback: true,
    });

    expect(result.granted).toBe(true);
    expect(result.message).toContain('Acesso Liberado');
  });

  it('deve identificar quando o aluno possui matrícula ativa em OUTRA academia', async () => {
    // 1st query: busca matrícula nesta academia -> retorna null
    const qbMockThisGym: any = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(null),
    };

    // 2nd query: busca matrícula ativa em outra academia -> retorna matrícula da Academia Sul
    const qbMockOtherGym: any = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue({
        id: 'enr-other',
        academiaId: otherAcademiaId,
        studentId,
        planName: 'Plano Crossfit',
        endDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
        status: EnrollmentStatus.ACTIVE,
        academia: { name: 'Academia Fit Sul' },
        student: { id: studentId, name: 'Fernanda Rocha', email: 'fernanda@test.com' },
      }),
    };

    mockEnrollmentRepo.createQueryBuilder
      .mockReturnValueOnce(qbMockThisGym)
      .mockReturnValueOnce(qbMockOtherGym);

    mockUserRepo.findOneBy.mockResolvedValue({
      id: studentId,
      name: 'Fernanda Rocha',
      email: 'fernanda@test.com',
    });

    const result = await service.validateAccess(academiaId, {
      qrCode: studentId,
    });

    expect(result.granted).toBe(false);
    expect(result.canChargeDayPass).toBe(true);
    expect(result.message).toContain('Matrícula ativa pertence à academia "Academia Fit Sul"');
    expect(result.reason).toContain('Academia Fit Sul');
  });
});
