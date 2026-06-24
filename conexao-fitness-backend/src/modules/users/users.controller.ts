import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreatePersonalProfileDto } from './dto/create-personal-profile.dto';
import { CreateAcademiaProfileDto } from './dto/create-academia-profile.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Usuários e Perfis (KYC)')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOneOrFail(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('me/profile/personal')
  createPersonalProfile(@CurrentUser() user: any, @Body() dto: CreatePersonalProfileDto) {
    return this.usersService.createPersonalProfile(user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('me/profile/academia')
  createAcademiaProfile(@CurrentUser() user: any, @Body() dto: CreateAcademiaProfileDto) {
    return this.usersService.createAcademiaProfile(user.id, dto);
  }
}
