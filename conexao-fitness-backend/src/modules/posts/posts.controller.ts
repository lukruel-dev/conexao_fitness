import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Comunidade & Feed (Posts)')
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @ApiOperation({ summary: 'Listar postagens do feed (Explorar ou Seguindo)' })
  @UseGuards(OptionalJwtAuthGuard)
  @Get()
  async findAll(
    @Query('feed') feed: 'explore' | 'following' = 'explore',
    @Query('tag') tag?: string,
    @Query('category') category?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @CurrentUser() user?: any,
  ) {
    return this.postsService.findAll(
      { feed, tag, category, page, limit },
      user?.id,
    );
  }

  @ApiOperation({ summary: 'Obter detalhes de uma postagem' })
  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id')
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user?: any,
  ) {
    return this.postsService.findById(id, user?.id);
  }

  @ApiOperation({ summary: 'Criar nova postagem no feed/fórum' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @Body() dto: CreatePostDto,
    @CurrentUser() user: any,
  ) {
    return this.postsService.create(dto, user.id);
  }

  @ApiOperation({ summary: 'Excluir postagem' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    return this.postsService.deletePost(id, user.id);
  }

  @ApiOperation({ summary: 'Curtir ou descurtir uma postagem' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(':id/like')
  async toggleLike(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    return this.postsService.toggleLike(id, user.id);
  }

  @ApiOperation({ summary: 'Listar comentários de uma postagem' })
  @Get(':id/comments')
  async findComments(@Param('id', ParseUUIDPipe) id: string) {
    return this.postsService.findComments(id);
  }

  @ApiOperation({ summary: 'Adicionar comentário em uma postagem' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(':id/comments')
  async createComment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateCommentDto,
    @CurrentUser() user: any,
  ) {
    return this.postsService.createComment(id, user.id, dto);
  }

  @ApiOperation({ summary: 'Seguir ou deixar de seguir um perfil de usuário' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('users/:userId/follow')
  async toggleFollow(
    @Param('userId', ParseUUIDPipe) targetUserId: string,
    @CurrentUser() user: any,
  ) {
    return this.postsService.toggleFollow(targetUserId, user.id);
  }

  @ApiOperation({ summary: 'Verificar status de seguidor de um usuário' })
  @UseGuards(OptionalJwtAuthGuard)
  @Get('users/:userId/follow-status')
  async getFollowStatus(
    @Param('userId', ParseUUIDPipe) targetUserId: string,
    @CurrentUser() user?: any,
  ) {
    return this.postsService.getFollowStatus(targetUserId, user?.id);
  }
}
