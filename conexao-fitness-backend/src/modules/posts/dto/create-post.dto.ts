import { IsArray, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreatePostDto {
  @IsNotEmpty({ message: 'O conteúdo da postagem não pode estar vazio' })
  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  category?: string;

  @IsOptional()
  @IsArray()
  tags?: string[];

  @IsOptional()
  @IsArray()
  mediaUrls?: string[];

  @IsOptional()
  workoutRoutine?: {
    title?: string;
    level?: string;
    exercises?: Array<{
      name: string;
      sets?: string;
      reps?: string;
      restSeconds?: number;
      notes?: string;
    }>;
  };
}
