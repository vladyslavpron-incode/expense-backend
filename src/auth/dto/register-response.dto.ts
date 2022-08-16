import type { User } from 'src/users/user.entity';

export class RegisterResponseDto {
  user!: User;
  tokens!: {
    refreshToken: string;
    accessToken: string;
  };
}
