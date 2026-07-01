import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { ChatService } from './src/modules/chat/chat.service';
import { BookingsService } from './src/modules/bookings/bookings.service';
import { DataSource } from 'typeorm';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);
  const chatService = app.get(ChatService);
  const bookingsService = app.get(BookingsService);

  console.log('Buscando um agendamento CONFIRMED...');
  const bookingRepo = dataSource.getRepository('Booking');
  const booking = await bookingRepo.findOne({ 
    where: { status: 'CONFIRMED' },
    relations: ['service']
  }) as any;

  if (!booking) {
    console.log('Nenhum agendamento CONFIRMED encontrado.');
    process.exit(1);
  }

  console.log(`Usando booking ID: ${booking.id}`);
  
  try {
    console.log('1. Testando filtro de PIX...');
    const msg1 = await chatService.sendMessage(booking.id, booking.studentId, 'Me passa um PIX aí!');
    console.log('Mensagem salva:', msg1.content);

    console.log('2. Testando filtro de telefone (11 números)...');
    const msg2 = await chatService.sendMessage(booking.id, booking.studentId, 'Me chama no whats 11999999999');
    console.log('Mensagem salva:', msg2.content);

    console.log('3. Testando filtro de telefone formatado...');
    const msg3 = await chatService.sendMessage(booking.id, booking.service.providerId, 'Pode me ligar no (55) 99123-4567');
    console.log('Mensagem salva:', msg3.content);

    console.log('4. Testando mensagem limpa...');
    const msg4 = await chatService.sendMessage(booking.id, booking.studentId, 'Legal, chego às 15h!');
    console.log('Mensagem salva:', msg4.content);

    console.log('5. Listando mensagens...');
    const msgs = await chatService.getMessages(booking.id, booking.studentId);
    msgs.forEach(m => console.log(`[${m.createdAt}] ${m.senderId}: ${m.content}`));

  } catch (error) {
    console.error('Erro no teste:', error);
  }

  await app.close();
}

bootstrap().catch(console.error);
