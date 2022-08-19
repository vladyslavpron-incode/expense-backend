import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import {
  forwardRef,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { UsersService } from 'src/users/users.service';
import type { User } from 'src/users/user.entity';
import type { AccessTokenPayload } from '../tokens.service';
import { ConfigService } from '@nestjs/config';
import type { Config } from 'src/utils/config';

@Injectable()
export class AccessStrategy extends PassportStrategy(Strategy, 'access') {
  constructor(
    @Inject(forwardRef(() => ConfigService))
    protected readonly configService: ConfigService<Config, true>,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('ACCESS_TOKEN_SECRET_KEY'),
    });
  }

  async validate(payload: AccessTokenPayload): Promise<User> {
    if (!payload) {
      throw new UnauthorizedException(
        'Your access token is invalid or has expired',
      );
    }

    const user = await this.usersService.getUserById(payload.id);

    if (!user) {
      throw new UnauthorizedException('Your access token is invalid');
    }

    if (
      user.logoutTimestamp &&
      payload.iat &&
      payload.iat * 1000 < user.logoutTimestamp.getTime()
    ) {
      throw new UnauthorizedException('Your access token has expired');
    }
    return user;
  }
}
