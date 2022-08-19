import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import parse from 'parse-duration';
import type { User, UserRoles } from 'src/users/user.entity';
import type { Config } from 'src/utils/config';

@Injectable()
export class TokensService {
  constructor(
    private readonly configService: ConfigService<Config, true>,
    @Inject(forwardRef(() => JwtService))
    private readonly jwtService: JwtService,
  ) {}

  validateAccessToken(accessToken: string): AccessTokenPayload | null {
    try {
      const payload: AccessTokenPayload = this.jwtService.verify(
        accessToken,
        this.accessTokenOptions,
      );
      return payload;
    } catch (e) {
      return null;
    }
  }

  validateRefreshToken(refreshToken: string): RefreshTokenPayload | null {
    try {
      const payload: RefreshTokenPayload = this.jwtService.verify(
        refreshToken,
        this.refreshTokenOptions,
      );
      return payload;
    } catch (e) {
      return null;
    }
  }

  generateAccessToken(user: User): string {
    const payload: AccessTokenPayload = {
      id: user.id,
      username: user.username,
      role: user.role,
    };
    return this.jwtService.sign(payload, this.accessTokenOptions);
  }

  generateRefreshToken(user: User): string {
    const payload: RefreshTokenPayload = {
      id: user.id,
      username: user.username,
      role: user.role,
    };
    return this.jwtService.sign(payload, this.refreshTokenOptions);
  }

  accessTokenOptions = {
    expiresIn: this.configService.get('ACCESS_TOKEN_EXPIRES_IN'),
    secret: this.configService.get('ACCESS_TOKEN_SECRET_KEY'),
  };

  refreshTokenOptions = {
    expiresIn: this.configService.get('REFRESH_TOKEN_EXPIRES_IN'),
    secret: this.configService.get('REFRESH_TOKEN_SECRET_KEY'),
  };

  refreshTokenCookieOptions = {
    // 30 days
    maxAge: parse(this.configService.get('REFRESH_TOKEN_COOKIE_MAX_AGE')),
    httpOnly: true,
  };
}

export interface RefreshTokenPayload {
  id: number;
  username: string;
  role: UserRoles;
  iat?: number;
}

export interface AccessTokenPayload {
  id: number;
  username: string;
  role: UserRoles;
  iat?: number;
}
