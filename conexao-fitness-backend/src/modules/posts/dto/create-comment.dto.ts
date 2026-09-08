import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateCommentDto {
  @IsNotEmpty({ message: 'O comentário não pode estar vazio' })
  @IsString()
  @MaxLength(1000)
  content: string;
}
