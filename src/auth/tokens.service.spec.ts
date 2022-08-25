import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { user1 } from 'src/users/users.stubs';
import { TokensService } from './tokens.service';

describe('AuthService', () => {
  let tokensService: TokensService;

  const jwtServiceMock = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      providers: [
        ConfigService,
        TokensService,
        { provide: JwtService, useValue: jwtServiceMock },
      ],
    }).compile();
    tokensService = app.get<TokensService>(TokensService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateAccessToken method', () => {
    it('should validate accessToken and return payload or null', () => {
      const spyJwtVerify = jest
        .spyOn(jwtServiceMock, 'verify')
        .mockReturnValue({});

      tokensService.validateAccessToken('');

      expect(spyJwtVerify).toBeCalled();
    });

    it('should return null on invalid accessToken ', () => {
      const spyJwtVerify = jest
        .spyOn(jwtServiceMock, 'verify')
        .mockImplementation(() => {
          throw new Error();
        });

      expect(tokensService.validateAccessToken('')).toBeNull();

      expect(spyJwtVerify).toThrow();
    });
  });

  describe('validateRefeshToken method', () => {
    it('should validate refreshToken and return payload', () => {
      const spyJwtVerify = jest
        .spyOn(jwtServiceMock, 'verify')
        .mockReturnValue({});

      tokensService.validateRefreshToken('');

      expect(spyJwtVerify).toBeCalled();
    });

    it('should return null on invalid refreshToken ', () => {
      const spyJwtVerify = jest
        .spyOn(jwtServiceMock, 'verify')
        .mockImplementation(() => {
          throw new Error();
        });

      expect(tokensService.validateRefreshToken('')).toBeNull();

      expect(spyJwtVerify).toThrow();
    });
  });

  describe('generateAccessToken method', () => {
    const user = user1;

    it('should return accessToken', () => {
      const spyJwtSign = jest.spyOn(jwtServiceMock, 'sign').mockReturnValue('');

      tokensService.generateAccessToken(user);

      expect(spyJwtSign).toBeCalled();
    });
  });

  describe('generateRefreshToken method', () => {
    const user = user1;

    it('should return refreshToken', () => {
      const spyJwtSign = jest.spyOn(jwtServiceMock, 'sign').mockReturnValue('');

      tokensService.generateRefreshToken(user);

      expect(spyJwtSign).toBeCalled();
    });
  });
});
