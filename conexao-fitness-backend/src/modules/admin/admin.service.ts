import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  async approveKyc(userId: string): Promise<User> {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }
    user.status = 'ATIVO';
    return this.usersRepo.save(user);
  }

  async rejectKyc(userId: string, reason: string): Promise<User> {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }
    // Poderia mudar para 'SUSPENSO' ou deixar pendente e notificar o motivo
    // Vamos voltar para 'PENDENTE_KYC' e o motivo iria por email, ou salvar um campo no banco
    user.status = 'PENDENTE_KYC'; 
    return this.usersRepo.save(user);
  }
}
