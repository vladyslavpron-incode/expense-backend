import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import {
  forwardRef,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

import { UsersService } from 'src/users/users.service';
import type { User } from 'src/users/user.entity';
import { ConfigService } from '@nestjs/config';
import type { Config } from 'src/utils/config';
import type { RefreshTokenPayload } from '../tokens.service';

@Injectable()
export class RefreshStrategy extends PassportStrategy(Strategy, 'refresh') {
  constructor(
    @Inject(forwardRef(() => ConfigService))
    protected readonly configService: ConfigService<Config, true>,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          const refreshToken = request.cookies['refreshToken'];

          if (!refreshToken) {
            return null;
          }
          return refreshToken;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get('REFRESH_TOKEN_SECRET_KEY'),
    });
  }

  async validate(payload: RefreshTokenPayload): Promise<User> {
    if (!payload) {
      throw new UnauthorizedException(
        'Your refresh token is invalid or has expired',
      );
    }

    const user = await this.usersService.getUserById(payload.id);

    if (!user) {
      throw new UnauthorizedException('Your refresh token is invalid');
    }

    return user;
  }
}
