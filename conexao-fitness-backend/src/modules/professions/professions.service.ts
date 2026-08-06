import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Profession } from './entities/profession.entity';

@Injectable()
export class ProfessionsService {
  constructor(
    @InjectRepository(Profession)
    private professionsRepository: Repository<Profession>,
  ) {}

  async create(title: string) {
    const existing = await this.professionsRepository.findOneBy({ title });
    if (existing) {
      throw new ConflictException('Profissão já cadastrada');
    }
    const profession = this.professionsRepository.create({ title });
    return this.professionsRepository.save(profession);
  }

  findAll(onlyActive = true) {
    if (onlyActive) {
      return this.professionsRepository.find({ where: { isActive: true }, order: { title: 'ASC' } });
    }
    return this.professionsRepository.find({ order: { title: 'ASC' } });
  }

  async findOne(id: string) {
    const profession = await this.professionsRepository.findOneBy({ id });
    if (!profession) {
      throw new NotFoundException('Profissão não encontrada');
    }
    return profession;
  }

  async update(id: string, updateData: { title?: string; isActive?: boolean }) {
    const profession = await this.findOne(id);
    if (updateData.title && updateData.title !== profession.title) {
      const existing = await this.professionsRepository.findOneBy({ title: updateData.title });
      if (existing) {
        throw new ConflictException('Profissão já cadastrada');
      }
    }
    Object.assign(profession, updateData);
    return this.professionsRepository.save(profession);
  }

  async remove(id: string) {
    const profession = await this.findOne(id);
    return this.professionsRepository.remove(profession);
  }
}
