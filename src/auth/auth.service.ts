import {
  BadRequestException,
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { User } from 'src/users/user.entity';
import { UsersService } from 'src/users/users.service';

import bcrypt from 'bcrypt';
import type { CreateUserDto } from 'src/users/dto/create-user.dto';
import type { LoginUserDto } from 'src/users/dto/login-user.dto';
import type { RegisterResponseDto } from './dto/register-response.dto';
import type { LoginResponseDto } from './dto/login-response.dto';
import { TokensService } from './tokens.service';
import type { UpdatePasswordDto } from './dto/update-password.dto';

@Injectable()
export class AuthService {
  constructor(
    @Inject(forwardRef(() => TokensService))
    private readonly tokensService: TokensService,
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

    const accessToken = this.tokensService.generateAccessToken(user);
    const refreshToken = this.tokensService.generateRefreshToken(user);

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

    const accessToken = this.tokensService.generateAccessToken(user);
    const refreshToken = this.tokensService.generateRefreshToken(user);

    await this.usersService.updateUserRefreshToken(user.id, refreshToken);
    user.refreshToken = refreshToken;

    return {
      user,
      tokens: { accessToken, refreshToken },
    };
  }

  async refresh(refreshToken: string): Promise<string> {
    const payload = this.tokensService.validateRefreshToken(refreshToken);
    const savedUser = await this.usersService.getUserByRefreshToken(
      refreshToken,
    );

    if (!payload || !savedUser) {
      throw new UnauthorizedException(
        'Your refresh token is invalid or has expired',
      );
    }

    const accessToken = this.tokensService.generateAccessToken(savedUser);

    return accessToken;
  }

  async updatePassword(
    user: User,
    updatePasswordDto: UpdatePasswordDto,
  ): Promise<null> {
    if (
      updatePasswordDto.newPassword !== updatePasswordDto.newPasswordConfirm
    ) {
      throw new BadRequestException(
        'newPassword and newPasswordConfirm does not match',
      );
    }

    const isPasswordCorrect = await bcrypt.compare(
      updatePasswordDto.currentPassword,
      user.password,
    );

    if (!isPasswordCorrect) {
      throw new BadRequestException('Invalid currentPassword');
    }

    await this.usersService.updateUserPassword(
      user,
      updatePasswordDto.newPassword,
    );
    await this.logout(user);
    return null;
  }

  async logout(user: User): Promise<null> {
    await this.usersService.deleteUserRefreshToken(user.id);
    await this.usersService.updateUserLogoutTimestamp(user.id, new Date());

    return null;
  }
}
