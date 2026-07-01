import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateMessageDto } from './dto/create-message.dto';

@Controller('chat/messages')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  async sendMessage(
    @Body() createMessageDto: CreateMessageDto,
    @CurrentUser() user: any,
  ) {
    return this.chatService.sendMessage(
      createMessageDto.bookingId,
      user.id,
      createMessageDto.content,
    );
  }

  @Get(':bookingId')
  async getMessages(
    @Param('bookingId') bookingId: string,
    @CurrentUser() user: any,
  ) {
    return this.chatService.getMessages(bookingId, user.id);
  }
}
