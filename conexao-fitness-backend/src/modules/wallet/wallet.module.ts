import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { WalletAccount } from './entities/wallet-account.entity';
import { PaymentIntent } from './entities/payment-intent.entity';
import { QRModule } from '../qr/qr.module';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([WalletAccount, PaymentIntent]),
    QRModule,
    forwardRef(() => PaymentsModule),
  ],
  controllers: [WalletController],
  providers: [WalletService],
  exports: [WalletService],
})
export class WalletModule {}
