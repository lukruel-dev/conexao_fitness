import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Post } from './entities/post.entity';
import { PostLike } from './entities/post-like.entity';
import { PostComment } from './entities/post-comment.entity';
import { UserFollow } from '../users/entities/user-follow.entity';
import { User } from '../users/entities/user.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private readonly postsRepo: Repository<Post>,

    @InjectRepository(PostLike)
    private readonly likesRepo: Repository<PostLike>,

    @InjectRepository(PostComment)
    private readonly commentsRepo: Repository<PostComment>,

    @InjectRepository(UserFollow)
    private readonly followsRepo: Repository<UserFollow>,

    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  async findAll(
    query: {
      feed?: 'explore' | 'following';
      authorId?: string;
      tag?: string;
      category?: string;
      page?: number;
      limit?: number;
    },
    currentUserId?: string,
  ) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    let followingIds: string[] = [];
    if (query.feed === 'following') {
      if (!currentUserId) {
        return { items: [], total: 0, page, limit, hasMore: false };
      }
      const follows = await this.followsRepo.find({
        where: { followerId: currentUserId },
        select: ['followingId'],
      });
      followingIds = follows.map((f) => f.followingId);
      if (followingIds.length === 0) {
        return { items: [], total: 0, page, limit, hasMore: false };
      }
    }

    const qb = this.postsRepo
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('author.alunoProfile', 'alunoProfile')
      .leftJoinAndSelect('author.personalProfile', 'personalProfile')
      .leftJoinAndSelect('author.academiaProfile', 'academiaProfile')
      .leftJoinAndSelect('post.sharedPost', 'sharedPost')
      .leftJoinAndSelect('sharedPost.author', 'sharedAuthor')
      .leftJoinAndSelect('sharedAuthor.alunoProfile', 'sharedAlunoProfile')
      .leftJoinAndSelect('sharedAuthor.personalProfile', 'sharedPersonalProfile')
      .leftJoinAndSelect('sharedAuthor.academiaProfile', 'sharedAcademiaProfile')
      .orderBy('post.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    if (query.authorId) {
      qb.andWhere('post.authorId = :authorId', { authorId: query.authorId });
    }

    if (query.feed === 'following' && followingIds.length > 0) {
      qb.andWhere('post.authorId IN (:...followingIds)', { followingIds });
    }

    if (query.category && query.category !== 'Todos') {
      qb.andWhere('post.category = :category', { category: query.category });
    }

    if (query.tag) {
      const formattedTag = query.tag.startsWith('#') ? query.tag : `#${query.tag}`;
      qb.andWhere('post.tags ::text ILIKE :tag', { tag: `%${formattedTag}%` });
    }

    const [items, total] = await qb.getManyAndCount();

    // Buscar likes e follows do usuário atual em lote se logado
    let myLikesSet = new Set<string>();
    let myFollowsSet = new Set<string>();

    if (currentUserId && items.length > 0) {
      const postIds = items.map((p) => p.id);
      const authorIds = Array.from(new Set(items.map((p) => p.authorId)));

      const [myLikes, myFollows] = await Promise.all([
        this.likesRepo.find({
          where: { userId: currentUserId, postId: In(postIds) },
          select: ['postId'],
        }),
        this.followsRepo.find({
          where: { followerId: currentUserId, followingId: In(authorIds) },
          select: ['followingId'],
        }),
      ]);

      myLikesSet = new Set(myLikes.map((l) => l.postId));
      myFollowsSet = new Set(myFollows.map((f) => f.followingId));
    }

    const mappedItems = items.map((post) => ({
      ...post,
      isLiked: myLikesSet.has(post.id),
      isFollowingAuthor: myFollowsSet.has(post.authorId),
    }));

    return {
      items: mappedItems,
      total,
      page,
      limit,
      hasMore: skip + items.length < total,
    };
  }

  async findById(id: string, currentUserId?: string) {
    const post = await this.postsRepo.findOne({
      where: { id },
      relations: [
        'author',
        'author.alunoProfile',
        'author.personalProfile',
        'author.academiaProfile',
        'sharedPost',
        'sharedPost.author',
        'sharedPost.author.alunoProfile',
        'sharedPost.author.personalProfile',
        'sharedPost.author.academiaProfile',
      ],
    });

    if (!post) {
      throw new NotFoundException('Postagem não encontrada');
    }

    let isLiked = false;
    let isFollowingAuthor = false;

    if (currentUserId) {
      const [like, follow] = await Promise.all([
        this.likesRepo.findOne({
          where: { postId: post.id, userId: currentUserId },
        }),
        this.followsRepo.findOne({
          where: { followerId: currentUserId, followingId: post.authorId },
        }),
      ]);
      isLiked = !!like;
      isFollowingAuthor = !!follow;
    }

    return {
      ...post,
      isLiked,
      isFollowingAuthor,
    };
  }

  async create(dto: CreatePostDto, authorId: string) {
    const author = await this.usersRepo.findOne({
      where: { id: authorId },
      relations: ['alunoProfile', 'personalProfile', 'academiaProfile'],
    });
    if (!author) {
      throw new NotFoundException('Usuário não encontrado');
    }

    let sharedPost: Post | null = null;
    if (dto.sharedPostId) {
      sharedPost = await this.postsRepo.findOne({
        where: { id: dto.sharedPostId },
        relations: ['author', 'author.alunoProfile', 'author.personalProfile', 'author.academiaProfile'],
      });
      if (sharedPost) {
        sharedPost.sharesCount = (sharedPost.sharesCount || 0) + 1;
        await this.postsRepo.save(sharedPost);
      }
    }

    const post = this.postsRepo.create({
      authorId,
      author,
      content: dto.content,
      category: dto.category || 'Geral',
      tags: dto.tags || [],
      mediaUrls: dto.mediaUrls || [],
      workoutRoutine: dto.workoutRoutine,
      sharedPostId: dto.sharedPostId,
      sharedPost: sharedPost ?? undefined,
      likesCount: 0,
      commentsCount: 0,
      sharesCount: 0,
    });

    const saved = await this.postsRepo.save(post);

    return {
      ...saved,
      isLiked: false,
      isFollowingAuthor: false,
    };
  }

  async toggleLike(postId: string, userId: string) {
    const post = await this.postsRepo.findOne({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException('Postagem não encontrada');
    }

    const existing = await this.likesRepo.findOne({
      where: { postId, userId },
    });

    if (existing) {
      await this.likesRepo.remove(existing);
      post.likesCount = Math.max(0, (post.likesCount || 0) - 1);
      await this.postsRepo.save(post);
      return { liked: false, likesCount: post.likesCount };
    } else {
      const newLike = this.likesRepo.create({ postId, userId });
      await this.likesRepo.save(newLike);
      post.likesCount = (post.likesCount || 0) + 1;
      await this.postsRepo.save(post);
      return { liked: true, likesCount: post.likesCount };
    }
  }

  async findComments(postId: string) {
    const comments = await this.commentsRepo.find({
      where: { postId },
      relations: [
        'author',
        'author.alunoProfile',
        'author.personalProfile',
        'author.academiaProfile',
      ],
      order: { createdAt: 'ASC' },
    });

    return comments;
  }

  async createComment(postId: string, authorId: string, dto: CreateCommentDto) {
    const post = await this.postsRepo.findOne({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException('Postagem não encontrada');
    }

    const author = await this.usersRepo.findOne({
      where: { id: authorId },
      relations: ['alunoProfile', 'personalProfile', 'academiaProfile'],
    });

    const comment = this.commentsRepo.create({
      postId,
      authorId,
      author: author ?? undefined,
      content: dto.content,
    });

    const savedComment = await this.commentsRepo.save(comment);

    post.commentsCount = (post.commentsCount || 0) + 1;
    await this.postsRepo.save(post);

    return savedComment;
  }

  async deletePost(postId: string, userId: string) {
    const post = await this.postsRepo.findOne({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException('Postagem não encontrada');
    }

    if (post.authorId !== userId) {
      throw new ForbiddenException('Você não tem permissão para excluir esta postagem');
    }

    await this.postsRepo.remove(post);
    return { success: true };
  }

  // --- Sistema de Seguir (Follows) ---

  async toggleFollow(targetUserId: string, followerId: string) {
    if (targetUserId === followerId) {
      throw new BadRequestException('Você não pode seguir a si mesmo');
    }

    const targetUser = await this.usersRepo.findOne({ where: { id: targetUserId } });
    if (!targetUser) {
      throw new NotFoundException('Usuário alvo não encontrado');
    }

    const existingFollow = await this.followsRepo.findOne({
      where: { followerId, followingId: targetUserId },
    });

    if (existingFollow) {
      await this.followsRepo.remove(existingFollow);
      const count = await this.followsRepo.count({ where: { followingId: targetUserId } });
      return { following: false, followersCount: count };
    } else {
      const follow = this.followsRepo.create({
        followerId,
        followingId: targetUserId,
      });
      await this.followsRepo.save(follow);
      const count = await this.followsRepo.count({ where: { followingId: targetUserId } });
      return { following: true, followersCount: count };
    }
  }

  async getFollowStatus(targetUserId: string, currentUserId?: string) {
    const [followersCount, followingCount, isFollowing] = await Promise.all([
      this.followsRepo.count({ where: { followingId: targetUserId } }),
      this.followsRepo.count({ where: { followerId: targetUserId } }),
      currentUserId && currentUserId !== targetUserId
        ? this.followsRepo
            .findOne({ where: { followerId: currentUserId, followingId: targetUserId } })
            .then((r) => !!r)
        : Promise.resolve(false),
    ]);

    return {
      isFollowing,
      followersCount,
      followingCount,
    };
  }
}
