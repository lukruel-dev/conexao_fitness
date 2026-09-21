import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from './modules/users/entities/user.entity';
import { ServiceCatalog } from './modules/service-catalog/entities/service-catalog.entity';
import { Service as AppService } from './modules/services/entities/service.entity';
import { ScheduleSlot } from './modules/services/entities/schedule-slot.entity';
import { PersonalProfile } from './modules/users/entities/personal-profile.entity';
import { AlunoProfile } from './modules/users/entities/aluno-profile.entity';
import { AcademiaProfile } from './modules/users/entities/academia-profile.entity';
import { WalletAccount } from './modules/wallet/entities/wallet-account.entity';
import { MembershipPlan } from './modules/memberships/entities/membership-plan.entity';
import { seedOfficialFinexAccounts } from './modules/users/official-test-accounts.seeder';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const usersRepo = app.get<Repository<User>>(getRepositoryToken(User));
  const catalogRepo = app.get<Repository<ServiceCatalog>>(getRepositoryToken(ServiceCatalog));
  const servicesRepo = app.get<Repository<AppService>>(getRepositoryToken(AppService));
  const slotsRepo = app.get<Repository<ScheduleSlot>>(getRepositoryToken(ScheduleSlot));
  const personalRepo = app.get<Repository<PersonalProfile>>(getRepositoryToken(PersonalProfile));
  const alunoRepo = app.get<Repository<AlunoProfile>>(getRepositoryToken(AlunoProfile));
  const academiaRepo = app.get<Repository<AcademiaProfile>>(getRepositoryToken(AcademiaProfile));
  const walletRepo = app.get<Repository<WalletAccount>>(getRepositoryToken(WalletAccount));
  const planRepo = app.get<Repository<MembershipPlan>>(getRepositoryToken(MembershipPlan));

  console.log('🚀 Iniciando Seeding de Contas de Teste Oficiais Finex...');

  await seedOfficialFinexAccounts({
    usersRepo,
    alunoRepo,
    personalRepo,
    academiaRepo,
    walletRepo,
    servicesRepo,
    slotsRepo,
    planRepo,
    catalogRepo,
  });

  console.log('\n======================================================');
  console.log('🎉 SEEDING CONCLUÍDO COM SUCESSO! LOGINS DE TESTE FINEX:');
  console.log('======================================================');
  console.log('1. 🏋️‍♂️ ALUNO / ATLETA:');
  console.log('   Email: aluno@finex.net.br | Senha: 123456 (Saldo: R$ 100,00)');
  console.log('2. ⚡ PERSONAL TRAINER:');
  console.log('   Email: personal@finex.net.br | Senha: 123456 (Diego Martins)');
  console.log('3. 🥗 NUTRICIONISTA:');
  console.log('   Email: nutri@finex.net.br | Senha: 123456 (Dra. Camila Alencar)');
  console.log('4. 🩺 FISIOTERAPEUTA:');
  console.log('   Email: fisio@finex.net.br | Senha: 123456 (Dr. Rodrigo Mendes)');
  console.log('5. 🏢 ACADEMIA PARCEIRA:');
  console.log('   Email: academia@finex.net.br | Senha: 123456 (Iron Peak Finex)');
  console.log('6. 🛡️ ADMINISTRADOR:');
  console.log('   Email: admin@finex.net.br | Senha: 123456');
  console.log('======================================================\n');

  await app.close();
}

bootstrap().catch((err) => {
  console.error('❌ Erro no seeding:', err);
  process.exit(1);
});
