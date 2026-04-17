import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QRService } from './qr.service';
import { QRController } from './qr.controller';
import { QRCharge } from './entities/qr-charge.entity';

@Module({
  imports: [TypeOrmModule.forFeature([QRCharge])],
  controllers: [QRController],
  providers: [QRService],
  exports: [QRService], // importante para outros módulos usarem
})
export class QRModule {}
