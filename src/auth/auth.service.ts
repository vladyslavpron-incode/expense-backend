import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { User } from 'src/users/user.entity';
import { UsersService } from 'src/users/users.service';
import {
  accessTokenOptions,
  AccessTokenPayload,
  refreshTokenOptions,
  RefreshTokenPayload,
} from './tokens.settings';
import bcrypt from 'bcrypt';
import type { CreateUserDto } from 'src/users/dto/create-user.dto';
import type { LoginUserDto } from 'src/users/dto/login-user.dto';
import type { RegisterResponseDto } from './dto/register-response.dto';
import type { LoginResponseDto } from './dto/login-response.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  async register(createUserDto: CreateUserDto): Promise<RegisterResponseDto> {
    const savedUser = await this.usersService.getUserByUsername(
      createUserDto.username,
    );

    if (savedUser) {
      throw new ConflictException(
        `username ${createUserDto.username} is already in use`,
      );
    }

    const user = await this.usersService.createUser(createUserDto);

    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    user.refreshToken = refreshToken;
    await this.usersService.updateUserRefreshToken(user.id, refreshToken);

    return {
      user,
      tokens: { accessToken, refreshToken },
    };
  }

  async login(candidate: LoginUserDto): Promise<LoginResponseDto> {
    const user = await this.usersService.getUserByUsername(candidate.username);

    if (!user) {
      throw new UnauthorizedException('wrong username or password');
    }

    const passwordsMatch = await bcrypt.compare(
      candidate.password,
      user.password,
    );

    if (!passwordsMatch) {
      throw new UnauthorizedException('wrong username or password');
    }

    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    await this.usersService.updateUserRefreshToken(user.id, refreshToken);
    user.refreshToken = refreshToken;

    return {
      user,
      tokens: { accessToken, refreshToken },
    };
  }

  async refresh(refreshToken: string): Promise<string> {
    const payload = this.validateRefreshToken(refreshToken);
    const savedUser = await this.usersService.getUserByRefreshToken(
      refreshToken,
    );

    if (!payload || !savedUser) {
      throw new UnauthorizedException(
        'Your refresh token is invalid or has expired',
      );
    }

    const accessToken = this.generateAccessToken(savedUser);

    return accessToken;
  }

  async logout(user: User): Promise<null> {
    await this.usersService.deleteUserRefreshToken(user.id);

    return null;
  }

  validateAccessToken(accessToken: string): AccessTokenPayload | null {
    try {
      const payload: AccessTokenPayload = this.jwtService.verify(
        accessToken,
        accessTokenOptions,
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
        refreshTokenOptions,
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

    return this.jwtService.sign(payload, accessTokenOptions);
  }

  generateRefreshToken(user: User): string {
    const payload: RefreshTokenPayload = {
      id: user.id,
      username: user.username,
      role: user.role,
    };
    return this.jwtService.sign(payload, refreshTokenOptions);
  }
}
