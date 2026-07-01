import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Review } from './entities/review.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { User } from '../users/entities/user.entity';
import { Booking, BookingStatus } from '../bookings/entities/booking.entity';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepo: Repository<Review>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,
    private readonly dataSource: DataSource,
  ) {}

  async createReview(dto: CreateReviewDto, studentId: string): Promise<Review> {
    return this.dataSource.transaction(async (manager) => {
      // 1. Validar se o booking pertence ao aluno e está CONFIRMED
      const booking = await manager.findOne(Booking, {
        where: { id: dto.bookingId },
        relations: ['service'],
      });

      if (!booking) {
        throw new NotFoundException('Agendamento não encontrado');
      }

      if (booking.studentId !== studentId) {
        throw new BadRequestException('Você não tem permissão para avaliar este agendamento');
      }

      if (booking.status !== BookingStatus.CONFIRMED) { // Ou COMPLETED se existir futuramente
        throw new BadRequestException('Você só pode avaliar um agendamento confirmado');
      }

      // 2. Checar se já existe review deste booking
      const existingReview = await manager.findOne(Review, {
        where: { bookingId: booking.id },
      });
      if (existingReview) {
        throw new BadRequestException('Você já avaliou este agendamento');
      }

      // 3. Criar a review
      const providerId = booking.service.providerId;
      const review = manager.create(Review, {
        rating: dto.rating,
        comment: dto.comment,
        bookingId: booking.id,
        studentId,
        providerId,
      });
      await manager.save(review);

      // 4. Atualizar a nota média do provedor no banco
      // Usamos uma query agregada pura por consistência
      const result = await manager
        .createQueryBuilder(Review, 'review')
        .select('AVG(review.rating)', 'averageRating')
        .addSelect('COUNT(review.id)', 'totalReviews')
        .where('review.providerId = :providerId', { providerId })
        .getRawOne();

      const newAvg = parseFloat(result.averageRating) || 5.0;
      const newTotal = parseInt(result.totalReviews) || 0;

      await manager.update(User, { id: providerId }, {
        averageRating: newAvg,
        totalReviews: newTotal,
      });

      return review;
    });
  }
}
