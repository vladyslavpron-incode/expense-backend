import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CategoriesService } from 'src/categories/categories.service';
import { Category } from 'src/categories/category.entity';
import {
  DeepPartial,
  DeleteResult,
  ILike,
  Repository,
  UpdateResult,
} from 'typeorm';
import { User, UserRoles } from './user.entity';
import bcrypt from 'bcrypt';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  admin1,
  admin2,
  createUserDto1,
  updateUserDto1,
  user1,
  user2,
  users,
} from './users.stubs';

describe('UserService', () => {
  let usersService: UsersService;
  let usersRepositoryMock: Repository<User>;

  const categoriesServiceMock = {
    createDefaultCategories: jest.fn(),
  };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useClass: Repository },
        { provide: getRepositoryToken(Category), useClass: Repository },
        { provide: CategoriesService, useValue: categoriesServiceMock },
      ],
    }).compile();

    usersService = app.get<UsersService>(UsersService);
    usersRepositoryMock = app.get<Repository<User>>(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllUsers method', () => {
    const usersArray = { ...users };
    it('should return array of users', async () => {
      const spyRepositoryFind = jest
        .spyOn(usersRepositoryMock, 'find')
        .mockResolvedValue(usersArray);

      const result = await usersService.getAllUsers();

      expect(spyRepositoryFind).toHaveBeenCalled();
      expect(result).toEqual(usersArray);
    });
  });

  describe('getUserById method', () => {
    const user = user1;

    it('should return one user', async () => {
      const spyRepositoryFindOne = jest
        .spyOn(usersRepositoryMock, 'findOne')
        .mockResolvedValue(user);

      const result = await usersService.getUserById(user.id);

      expect(spyRepositoryFindOne).toHaveBeenCalledWith({
        where: { id: user.id },
      });
      expect(result).toEqual(user);
    });
  });

  describe('getUserByUsername method', () => {
    const user = user1;
    it('should return one user', async () => {
      const spyRepositoryFindOne = jest
        .spyOn(usersRepositoryMock, 'findOne')
        .mockResolvedValue(user);

      const result = await usersService.getUserByUsername(user.username);

      expect(spyRepositoryFindOne).toBeCalledWith({
        where: { username: ILike(user.username) },
      });
      expect(result).toEqual(user);
    });
  });

  describe('getUserByRefreshToken method', () => {
    const user = user1;
    it('should return one user', async () => {
      const spyRepositoryFindOne = jest
        .spyOn(usersRepositoryMock, 'findOne')
        .mockResolvedValue(user);

      const result = await usersService.getUserByRefreshToken(
        user.refreshToken,
      );

      expect(spyRepositoryFindOne).toBeCalledWith({
        where: { refreshToken: user.refreshToken },
      });

      expect(result).toEqual(user);
    });
  });

  describe('createUser method', () => {
    const createUserDto = createUserDto1;

    it('should create user, default categories, hash password and return user', async () => {
      const user = { ...user1 };
      const spyRepositoryCreate = jest
        .spyOn(usersRepositoryMock, 'create')
        .mockReturnValue(user);

      const spyRepositorySave = jest
        .spyOn(usersRepositoryMock, 'save')
        .mockResolvedValue(user);

      const spyCreateDefaultCategories = jest.spyOn(
        categoriesServiceMock,
        'createDefaultCategories',
      );

      const spyBcryptHash = jest
        .spyOn(bcrypt, 'hash')
        .mockImplementation(() => Promise.resolve(''));

      const result = await usersService.createUser(createUserDto);

      expect(spyRepositoryCreate).toHaveBeenCalled();
      expect(spyRepositorySave).toHaveBeenCalled();
      expect(spyCreateDefaultCategories).toBeCalled();
      expect(spyBcryptHash).toHaveBeenCalled();
      expect(result).toEqual(user);
    });

    it('should assign admin role to first user', async () => {
      const firstUser = { ...user1, id: 1, password: '' };
      const firstUserAdminRole = { ...firstUser, role: UserRoles.ADMIN };
      const spyRepositoryCreate = jest
        .spyOn(usersRepositoryMock, 'create')
        .mockReturnValue(firstUser);

      // because this method uses .save two times
      const spyRepositorySave = jest
        .spyOn(usersRepositoryMock, 'save')
        .mockImplementation(
          (user: DeepPartial<User>) =>
            Promise.resolve(user.id ? user : firstUser) as Promise<User>,
        );

      const spyCreateDefaultCategories = jest.spyOn(
        categoriesServiceMock,
        'createDefaultCategories',
      );

      const spyBcryptHash = jest
        .spyOn(bcrypt, 'hash')
        .mockImplementation(() => Promise.resolve(''));

      const result = await usersService.createUser(createUserDto);

      expect(spyRepositoryCreate).toHaveBeenCalled();
      expect(spyRepositorySave).toHaveBeenCalled();
      expect(spyCreateDefaultCategories).toBeCalled();
      expect(spyBcryptHash).toHaveBeenCalled();
      expect(result).toEqual(firstUserAdminRole);
    });
  });

  describe('updateUser method', () => {
    const user = user1;
    const updateUserDto = updateUserDto1;
    const updatedUser = { ...user1, ...updateUserDto };
    const anotherUser = user2;

    const admin = admin1;
    const anotherAdmin = admin2;

    it('should update user by himself', async () => {
      jest.spyOn(usersRepositoryMock, 'findOne').mockResolvedValue(user);

      jest
        .spyOn(usersService, 'getUserByUsername')
        .mockImplementation(() => Promise.resolve(null));

      const spyRepositorySave = jest
        .spyOn(usersRepositoryMock, 'save')
        .mockResolvedValue(updatedUser);

      const result = await usersService.updateUser(user, updateUserDto, user);

      expect(spyRepositorySave).toBeCalled();

      expect(result).toEqual(updatedUser);
    });

    it('should update user by admin', async () => {
      jest.spyOn(usersRepositoryMock, 'findOne').mockResolvedValue(user);

      jest
        .spyOn(usersService, 'getUserByUsername')
        .mockImplementation(() => Promise.resolve(null));

      const spyRepositorySave = jest
        .spyOn(usersRepositoryMock, 'save')
        .mockResolvedValue(updatedUser);

      const result = await usersService.updateUser(
        user.id,
        updateUserDto,
        admin,
      );

      expect(spyRepositorySave).toBeCalled();

      expect(result).toEqual(updatedUser);
    });

    it('should throw NotFoundException on updating non-existing user by admin', async () => {
      const spyRepositoryFindOne = jest
        .spyOn(usersRepositoryMock, 'findOne')
        .mockResolvedValue(null);

      expect(
        usersService.updateUser(user.id, updateUserDto, admin),
      ).rejects.toThrowError(NotFoundException);

      expect(spyRepositoryFindOne).toBeCalled();
    });

    it('should throw ForbiddenException on updating admin by admin', async () => {
      const spyRepositoryFindOne = jest
        .spyOn(usersRepositoryMock, 'findOne')
        .mockResolvedValue(admin);

      expect(
        usersService.updateUser(admin.id, updateUserDto, anotherAdmin),
      ).rejects.toThrowError(ForbiddenException);

      expect(spyRepositoryFindOne).toBeCalled();
    });

    it('should throw ForbiddenException on updating role as non-admin', async () => {
      const updateUserDtoWithRole = {
        ...updateUserDto,
        role: UserRoles.ADMIN,
      };

      jest.spyOn(usersRepositoryMock, 'findOne').mockResolvedValue(user);

      expect(
        usersService.updateUser(user, updateUserDtoWithRole, user),
      ).rejects.toThrowError(ForbiddenException);
    });

    it('should throw ConflictException on updating username to one already exists', async () => {
      const updateUserDtoWithUsername = {
        ...updateUserDto,
        username: anotherUser.username,
      };

      jest.spyOn(usersRepositoryMock, 'findOne').mockResolvedValue(user);

      const spyGetUserByUsername = jest
        .spyOn(usersService, 'getUserByUsername')
        .mockImplementation(() => Promise.resolve(anotherUser));

      await expect(() =>
        usersService.updateUser(user, updateUserDtoWithUsername, user),
      ).rejects.toThrowError(ConflictException);
      expect(spyGetUserByUsername).toBeCalled();
    });
  });

  describe('updateUserPassword method', () => {
    const password = 'Abcde_12345';
    it('should update user password, hashed in advance', async () => {
      const user = { ...user1 };

      const spyRepositorySave = jest
        .spyOn(usersRepositoryMock, 'save')
        .mockResolvedValue(user);
      const spyBcryptHash = jest
        .spyOn(bcrypt, 'hash')
        .mockImplementation(() => Promise.resolve(''));

      await usersService.updateUserPassword(user, password);

      expect(spyBcryptHash).toBeCalled();
      expect(spyRepositorySave).toBeCalled();
    });
  });

  describe('updateUserRefreshToken method', () => {
    const user = user1;
    const refreshToken = 'veryveryRefreshToken';

    it('should update user refresh token', async () => {
      const spyRepositoryUpdate = jest
        .spyOn(usersRepositoryMock, 'update')
        .mockResolvedValue(new UpdateResult());

      await usersService.updateUserRefreshToken(user.id, refreshToken);

      expect(spyRepositoryUpdate).toBeCalledWith(
        { id: user.id },
        { refreshToken },
      );
    });
  });

  describe('deleteUserRefreshToken method', () => {
    const user = user1;

    it('should delete user refresh token', async () => {
      const spyRepositoryUpdate = jest
        .spyOn(usersRepositoryMock, 'update')
        .mockResolvedValue(new UpdateResult());

      await usersService.deleteUserRefreshToken(user.id);

      expect(spyRepositoryUpdate).toBeCalledWith(
        { id: user.id },
        { refreshToken: '' },
      );
    });
  });

  describe('updateUserLogoutTimestamp method', () => {
    const user = user1;
    const timestamp = new Date();

    it('should update user logout timestamp', async () => {
      const spyRepositoryUpdate = jest
        .spyOn(usersRepositoryMock, 'update')
        .mockResolvedValue(new UpdateResult());

      await usersService.updateUserLogoutTimestamp(user.id, timestamp);

      expect(spyRepositoryUpdate).toBeCalledWith(
        { id: user.id },
        { logoutTimestamp: timestamp },
      );
    });
  });

  describe('deleteUser method', () => {
    const user = user1;
    const admin = admin1;
    const anotherAdmin = admin2;

    it('should delete own user with correct password', async () => {
      const password = 'verysecretpassword';

      const spyRepositoryDelete = jest
        .spyOn(usersRepositoryMock, 'delete')
        .mockResolvedValue(new DeleteResult());

      const spyBcryptCompare = jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(() => Promise.resolve(true));

      await usersService.deleteUser(user, user, { password });

      expect(spyRepositoryDelete).toBeCalledWith({ id: user.id });
      expect(spyBcryptCompare).toBeCalled();
    });

    it('should throw BadRequestException on deleting own account with wrong password', async () => {
      const password = 'verysecretpassword';

      const spyBcryptCompare = jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(() => Promise.resolve(false));

      expect(
        usersService.deleteUser(user, user, { password }),
      ).rejects.toThrowError(BadRequestException);

      expect(spyBcryptCompare).toBeCalled();
    });

    it('should throw NotFoundException on deleting another user that does not exists', async () => {
      const spyGetUserById = jest
        .spyOn(usersService, 'getUserById')
        .mockResolvedValue(null);

      expect(usersService.deleteUser(0, admin)).rejects.toThrowError(
        NotFoundException,
      );

      expect(spyGetUserById).toBeCalled();
    });

    it('should throw ForbiddenException on deleting admin by another admin', async () => {
      const spyGetUserById = jest
        .spyOn(usersService, 'getUserById')
        .mockResolvedValue(anotherAdmin);

      expect(
        usersService.deleteUser(anotherAdmin.id, admin),
      ).rejects.toThrowError(ForbiddenException);

      expect(spyGetUserById).toBeCalled();
    });

    it('should throw BadRequestException on deleting own account without providing password', async () => {
      const spyRepositoryDelete = jest
        .spyOn(usersRepositoryMock, 'delete')
        .mockResolvedValue(new DeleteResult());

      await usersService.deleteUser(user, user);

      expect(spyRepositoryDelete).toBeCalledWith({ id: user.id });
    });

    it('should throw BadRequestException on deleting own account by passing id (as pretending to delete another account', async () => {
      expect(usersService.deleteUser(admin.id, admin)).rejects.toThrowError(
        BadRequestException,
      );
    });
  });
});
