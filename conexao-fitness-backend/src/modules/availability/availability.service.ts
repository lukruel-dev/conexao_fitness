import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProviderAvailability } from './entities/provider-availability.entity';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';

@Injectable()
export class AvailabilityService {
  constructor(
    @InjectRepository(ProviderAvailability)
    private readonly availabilityRepo: Repository<ProviderAvailability>,
  ) {}

  async getAvailability(providerId: string): Promise<ProviderAvailability[]> {
    return this.availabilityRepo.find({
      where: { providerId },
      order: { dayOfWeek: 'ASC', startTime: 'ASC' },
    });
  }

  async updateAvailability(providerId: string, dto: UpdateAvailabilityDto): Promise<ProviderAvailability[]> {
    // Basic validation of times
    for (const block of dto.availabilities) {
      if (!block.startTime.match(/^([01]\d|2[0-3]):([0-5]\d)$/)) {
        throw new BadRequestException(`Invalid startTime format: ${block.startTime}`);
      }
      if (!block.endTime.match(/^([01]\d|2[0-3]):([0-5]\d)$/)) {
        throw new BadRequestException(`Invalid endTime format: ${block.endTime}`);
      }
      if (block.startTime >= block.endTime) {
        throw new BadRequestException(`startTime must be before endTime`);
      }
    }

    // Delete existing availability for this provider
    await this.availabilityRepo.delete({ providerId });

    // Create new blocks
    const newBlocks = dto.availabilities.map(block => {
      const entity = new ProviderAvailability();
      entity.providerId = providerId;
      entity.dayOfWeek = block.dayOfWeek;
      entity.startTime = block.startTime;
      entity.endTime = block.endTime;
      return entity;
    });

    if (newBlocks.length > 0) {
      await this.availabilityRepo.save(newBlocks);
    }

    return this.getAvailability(providerId);
  }
}
