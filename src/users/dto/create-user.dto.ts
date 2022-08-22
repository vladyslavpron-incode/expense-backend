import { IsString, Length } from 'class-validator';

export class CreateUserDto {
  @IsString({ message: 'username must be a string' })
  @Length(4, 50, {
    message: 'username length must be in between 4 and 50 symbols',
  })
  readonly username!: string;

  @IsString({ message: 'displayName must be a string' })
  @Length(4, 50, {
    message: 'displayName length must be in between 4 and 50 symbols',
  })
  readonly displayName!: string;

  // @IsOptional()
  // @ApiPropertyOptional({
  //   enum: UserRoles,
  //   default: UserRoles.USER,
  //   description: 'User role',
  //   required: false,
  // })
  // @IsEnum(UserRoles, {
  //   message: `Role must be one of: ${Object.values(UserRoles).join(', ')}`,
  // })
  // readonly role?: UserRoles;

  @IsString({ message: 'Password must be a string' })
  @Length(4, 30, {
    message: 'Password length must be in between 4 and 30 symbols',
  })
  readonly password!: string;
}
