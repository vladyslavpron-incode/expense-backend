import {
  Body,
  Controller,
  Get,
  HttpCode,
  Patch,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { User } from 'src/users/user.entity';
import { AuthService } from './auth.service';
import { RefreshAuthGuard } from './guards/refresh-auth.guard';
import { AuthUser } from './decorators/user.decorator';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { LoginUserDto } from 'src/users/dto/login-user.dto';
import {
  ApiBasicAuth,
  ApiBearerAuth,
  ApiCookieAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { RegisterResponseDto } from './dto/register-response.dto';
import type { LoginResponseDto } from './dto/login-response.dto';
import type { RefreshResponseDto } from './dto/refresh-response.dto';
import { TokensService } from './tokens.service';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { AccessAuthGuard } from './guards/access-auth.guard';

@Controller('auth')
@ApiTags('Authentication')
export class AuthController {
  constructor(
    private readonly tokensService: TokensService,
    private readonly authService: AuthService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register new user' })
  register(@Body() createUserDto: CreateUserDto): Promise<RegisterResponseDto> {
    return this.authService.register(createUserDto);
  }

  @Post('login')
  @ApiBasicAuth()
  @ApiOperation({ summary: 'Login user' })
  @HttpCode(200)
  async login(
    @Body() candidate: LoginUserDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<LoginResponseDto> {
    const responseData = await this.authService.login(candidate);

    response.cookie(
      'refreshToken',
      responseData.tokens.refreshToken,
      this.tokensService.refreshTokenCookieOptions,
    );
    return responseData;
  }

  @Get('refresh')
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Get new access token using refresh token' })
  @UseGuards(RefreshAuthGuard)
  refresh(@AuthUser() user: User): RefreshResponseDto {
    const accessToken = this.tokensService.generateAccessToken(user);
    return { accessToken };
  }

  @Patch('update-password')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change password' })
  @UseGuards(AccessAuthGuard)
  async updatePassword(
    @AuthUser() user: User,
    @Body() updatePasswordDto: UpdatePasswordDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<null> {
    await this.authService.updatePassword(user, updatePasswordDto);

    response.clearCookie(
      'refreshToken',
      this.tokensService.refreshTokenCookieOptions,
    );

    return null;
  }

  @Post('logout')
  @ApiCookieAuth()
  @ApiOperation({
    summary: 'Logout user',
    description: 'Logout user using refreshToken stored in cookies',
  })
  @HttpCode(200)
  @UseGuards(RefreshAuthGuard)
  async logout(
    @AuthUser() user: User,
    @Res({ passthrough: true }) response: Response,
  ): Promise<null> {
    await this.authService.logout(user);

    response.clearCookie(
      'refreshToken',
      this.tokensService.refreshTokenCookieOptions,
    );

    return null;
  }
}
