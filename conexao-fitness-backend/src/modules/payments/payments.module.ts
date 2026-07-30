import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsService } from './payments.service';
import { PaymentsWebhookController } from './payments.webhook.controller';
import { Subscription } from './entities/subscription.entity';
import { User } from '../users/entities/user.entity';
import { PaymentsController } from './payments.controller';
import { BookingsModule } from '../bookings/bookings.module';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Subscription, User]),
    forwardRef(() => BookingsModule),
    forwardRef(() => WalletModule),
  ],
  providers: [PaymentsService],
  controllers: [PaymentsController, PaymentsWebhookController],
  exports: [PaymentsService],
})
export class PaymentsModule {}
