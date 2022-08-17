import type { User } from 'src/users/user.entity';

export class LoginResponseDto {
  user!: User;
  tokens!: {
    refreshToken: string;
    accessToken: string;
  };
}
