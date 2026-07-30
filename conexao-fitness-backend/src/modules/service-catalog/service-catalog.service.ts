import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateServiceCatalogDto } from './dto/create-service-catalog.dto';
import { UpdateServiceCatalogDto } from './dto/update-service-catalog.dto';
import { ServiceCatalog } from './entities/service-catalog.entity';

@Injectable()
export class ServiceCatalogService {
  constructor(
    @InjectRepository(ServiceCatalog)
    private readonly catalogRepository: Repository<ServiceCatalog>,
  ) {}

  async create(createServiceCatalogDto: CreateServiceCatalogDto): Promise<ServiceCatalog> {
    const catalog = this.catalogRepository.create(createServiceCatalogDto);
    return this.catalogRepository.save(catalog);
  }

  async findAll(onlyActive: boolean = true): Promise<ServiceCatalog[]> {
    return this.catalogRepository.find({
      where: onlyActive ? { isActive: true } : {},
      order: { modality: 'ASC', name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<ServiceCatalog> {
    const catalog = await this.catalogRepository.findOne({ where: { id } });
    if (!catalog) {
      throw new NotFoundException(`Service catalog ${id} not found`);
    }
    return catalog;
  }

  async update(id: string, updateServiceCatalogDto: UpdateServiceCatalogDto): Promise<ServiceCatalog> {
    const catalog = await this.findOne(id);
    Object.assign(catalog, updateServiceCatalogDto);
    return this.catalogRepository.save(catalog);
  }

  async remove(id: string): Promise<void> {
    const catalog = await this.findOne(id);
    // Instead of hard delete, we can soft delete or just set isActive to false
    catalog.isActive = false;
    await this.catalogRepository.save(catalog);
  }
}
