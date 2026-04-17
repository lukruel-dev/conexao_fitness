import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { WalletAccount } from './entities/wallet-account.entity';
import { PaymentIntent } from './entities/payment-intent.entity';
import { QRModule } from '../qr/qr.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([WalletAccount, PaymentIntent]),
    QRModule,
  ],
  controllers: [WalletController],
  providers: [WalletService],
})
export class WalletModule {}
