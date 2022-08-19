import { IsString, Length } from 'class-validator';

export class UpdatePasswordDto {
  @IsString({ message: 'currentPassword must be a string' })
  @Length(4, 30, {
    message: 'currentPassword length must be in between 4 and 30 symbols',
  })
  currentPassword!: string;

  @IsString({ message: 'newPassword must be a string' })
  @Length(4, 30, {
    message: 'newPassword length must be in between 4 and 30 symbols',
  })
  newPassword!: string;

  @IsString({ message: 'newPasswordConfirm must be a string' })
  @Length(4, 30, {
    message: 'newPasswordConfirm length must be in between 4 and 30 symbols',
  })
  newPasswordConfirm!: string;
}
