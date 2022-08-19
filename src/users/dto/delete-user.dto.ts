import { IsString, Length } from 'class-validator';

export class DeleteUserDto {
  @IsString({ message: 'Password must be a string' })
  @Length(4, 30, {
    message: 'Password length must be in between 4 and 30 symbols',
  })
  readonly password!: string;
}
