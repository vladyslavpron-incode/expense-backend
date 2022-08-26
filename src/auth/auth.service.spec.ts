import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from 'src/users/users.service';
import { createUserDto1, user1, user2 } from 'src/users/users.stubs';
import { AuthService } from './auth.service';
import { RefreshTokenPayload, TokensService } from './tokens.service';
import bcrypt from 'bcrypt';
import type { UpdatePasswordDto } from './dto/update-password.dto';

describe('AuthService', () => {
  let authService: AuthService;

  const tokensServiceMock = {
    generateAccessToken: jest.fn(),
    generateRefreshToken: jest.fn(),
    validateRefreshToken: jest.fn(),
  };

  const usersServiceMock = {
    getUserByUsername: jest.fn(),
    getUserByRefreshToken: jest.fn(),
    createUser: jest.fn(),
    updateUserRefreshToken: jest.fn(),
    updateUserPassword: jest.fn(),
    deleteUserRefreshToken: jest.fn(),
    updateUserLogoutTimestamp: jest.fn(),
  };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: TokensService, useValue: tokensServiceMock },
        { provide: UsersService, useValue: usersServiceMock },
      ],
    }).compile();
    jest.mock('bcrypt');
    authService = app.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register method', () => {
    const createUserDto = createUserDto1;
    const user = { ...user1 };
    const anotherUser = user2;

    it('should create user, generate tokens, save refresh token, return user and tokens', async () => {
      const expectedResult = {
        user: { ...user, refreshToken: '' },
        tokens: { accessToken: '', refreshToken: '' },
      };

      const spyGetUserByUsername = jest
        .spyOn(usersServiceMock, 'getUserByUsername')
        .mockResolvedValue(null);

      const spyCreateUser = jest
        .spyOn(usersServiceMock, 'createUser')
        .mockResolvedValue(user);

      const spyGenerateAccessToken = jest
        .spyOn(tokensServiceMock, 'generateAccessToken')
        .mockImplementation(() => '');
      const spyGenerateRefreshToken = jest
        .spyOn(tokensServiceMock, 'generateRefreshToken')
        .mockImplementation(() => '');

      const spyUpdateUserRefreshToken = jest
        .spyOn(usersServiceMock, 'updateUserRefreshToken')
        .mockImplementation(() => Promise.resolve());

      const result = await authService.register(createUserDto);

      expect(spyGetUserByUsername).toBeCalled();
      expect(spyCreateUser).toBeCalled();
      expect(spyGenerateAccessToken).toBeCalled();
      expect(spyGenerateRefreshToken).toBeCalled();
      expect(spyUpdateUserRefreshToken).toBeCalled();
      expect(result).toEqual(expectedResult);
    });

    it('should throw ConflictException when username is already used', async () => {
      const anotherUserWithSameUsername = {
        ...anotherUser,
        username: createUserDto.username,
      };
      const spyGetUserByUsername = jest
        .spyOn(usersServiceMock, 'getUserByUsername')
        .mockResolvedValue(anotherUserWithSameUsername);

      expect(authService.register(createUserDto)).rejects.toThrowError(
        ConflictException,
      );

      expect(spyGetUserByUsername).toBeCalled();
    });
  });

  describe('login method', () => {
    const user = { ...user1 };
    const loginUserDto = { username: user.username, password: user.password };

    it('should generate tokens, save refresh token, return user and tokens', async () => {
      const expectedResult = {
        user: { ...user, refreshToken: '' },
        tokens: { accessToken: '', refreshToken: '' },
      };

      const spyGetUserByUsername = jest
        .spyOn(usersServiceMock, 'getUserByUsername')
        .mockResolvedValue(user);

      const spyBcryptCompare = jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(() => Promise.resolve(true));

      const spyGenerateAccessToken = jest
        .spyOn(tokensServiceMock, 'generateAccessToken')
        .mockImplementation(() => '');
      const spyGenerateRefreshToken = jest
        .spyOn(tokensServiceMock, 'generateRefreshToken')
        .mockImplementation(() => '');

      const spyUpdateUserRefreshToken = jest
        .spyOn(usersServiceMock, 'updateUserRefreshToken')
        .mockImplementationOnce(() => Promise.resolve());

      const result = await authService.login(loginUserDto);

      expect(spyGetUserByUsername).toBeCalled();
      expect(spyBcryptCompare).toBeCalled();
      expect(spyGenerateAccessToken).toBeCalled();
      expect(spyGenerateRefreshToken).toBeCalled();
      expect(spyUpdateUserRefreshToken).toBeCalled();
      expect(result).toEqual(expectedResult);
    });

    it('should throw UnauthorizedException when password is wrong', async () => {
      const spyGetUserByUsername = jest
        .spyOn(usersServiceMock, 'getUserByUsername')
        .mockResolvedValue(user);

      const spyBcryptCompare = jest
        .spyOn(bcrypt, 'compare')
        .mockImplementationOnce(() => Promise.resolve(false));

      await expect(() => authService.login(loginUserDto)).rejects.toThrowError(
        UnauthorizedException,
      );

      expect(spyGetUserByUsername).toBeCalled();
      expect(spyBcryptCompare).toBeCalled();
    });

    it('should throw UnauthorizedException when user with specified username does not exists', async () => {
      const spyGetUserByUsername = jest
        .spyOn(usersServiceMock, 'getUserByUsername')
        .mockResolvedValue(null);

      expect(authService.login(loginUserDto)).rejects.toThrowError(
        UnauthorizedException,
      );

      expect(spyGetUserByUsername).toBeCalled();
    });
  });

  describe('refresh method', () => {
    const user = user1;
    const refreshPayload: RefreshTokenPayload = {
      id: user.id,
      username: user.username,
      role: user.role,
    };

    it('should call tokenservice to validate refresh token, ensure that user still exists, then generate and send new accessToken', async () => {
      const spyValidateRefreshToken = jest
        .spyOn(tokensServiceMock, 'validateRefreshToken')
        .mockReturnValue(refreshPayload);

      const spyGetUserByRefreshToken = jest
        .spyOn(usersServiceMock, 'getUserByRefreshToken')
        .mockResolvedValue(user);

      const spyGenerateAccessToken = jest
        .spyOn(tokensServiceMock, 'generateAccessToken')
        .mockReturnValue('');

      const result = await authService.refresh('');

      expect(spyValidateRefreshToken).toBeCalled();
      expect(spyGetUserByRefreshToken).toBeCalled();
      expect(spyGenerateAccessToken).toBeCalled();
      expect(result).toEqual('');
    });

    it('should throw UnauthorizedException when invalid refreshToken(no payload) or user with this token has not been found ', async () => {
      const spyValidateRefreshToken = jest
        .spyOn(tokensServiceMock, 'validateRefreshToken')
        .mockReturnValue(refreshPayload);

      const spyGetUserByRefreshToken = jest
        .spyOn(usersServiceMock, 'getUserByRefreshToken')
        .mockResolvedValue(null);

      expect(authService.refresh('')).rejects.toThrowError(
        UnauthorizedException,
      );

      expect(spyValidateRefreshToken).toBeCalled();
      expect(spyGetUserByRefreshToken).toBeCalled();
    });
  });

  describe('updatePassword method', () => {
    const user = user1;
    const updatePasswordDto: UpdatePasswordDto = {
      currentPassword: '1234',
      newPassword: 'newpassword',
      newPasswordConfirm: 'newpassword',
    };

    it('should update user password and logout user', async () => {
      const spyBcryptCompare = jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(() => Promise.resolve(true));

      const spyUpdateUserPassword = jest
        .spyOn(usersServiceMock, 'updateUserPassword')
        .mockResolvedValue({});

      const spyLogout = jest
        .spyOn(authService, 'logout')
        .mockResolvedValue(null);

      await authService.updatePassword(user, updatePasswordDto);

      expect(spyBcryptCompare).toBeCalled();
      expect(spyUpdateUserPassword).toBeCalled();
      expect(spyLogout).toBeCalled();
    });

    it('should throw BadRequestException when provided and current password does not match', async () => {
      const spyBcryptCompare = jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(() => Promise.resolve(false));

      expect(
        authService.updatePassword(user, updatePasswordDto),
      ).rejects.toThrowError(BadRequestException);

      expect(spyBcryptCompare).toBeCalled();
    });

    it('should throw BadRequestException when newPassword and newPasswordConfirm does not match', async () => {
      const dtoWithUnmatchingPassword = {
        ...updatePasswordDto,
        // just to make sure passwords are different
        newPasswordConfirm:
          updatePasswordDto.newPasswordConfirm === '1' ? '2' : '1',
      };

      expect(
        authService.updatePassword(user, dtoWithUnmatchingPassword),
      ).rejects.toThrowError(BadRequestException);
    });
  });

  describe('logout method', () => {
    const user = user1;
    it('should delete user refresh token and update logout timestamp', async () => {
      const spyDeleteUserRefreshToken = jest
        .spyOn(usersServiceMock, 'deleteUserRefreshToken')
        .mockResolvedValue(null);

      const spyUpdateUserLogoutTimestamp = jest
        .spyOn(usersServiceMock, 'deleteUserRefreshToken')
        .mockResolvedValue(null);

      await authService.logout(user);

      expect(spyDeleteUserRefreshToken).toBeCalled();
      expect(spyUpdateUserLogoutTimestamp).toBeCalled();
    });
  });
});
