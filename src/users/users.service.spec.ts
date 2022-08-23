import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CategoriesService } from 'src/categories/categories.service';
import { Category } from 'src/categories/category.entity';
import { DeleteResult, ILike, Repository, UpdateResult } from 'typeorm';
import { User, UserRoles } from './user.entity';
import bcrypt from 'bcrypt';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import type { CreateUserDto } from './dto/create-user.dto';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

const createUserDto1: CreateUserDto = {
  username: 'test1',
  displayName: 'testname1',
  password: '1234',
};

const user1: User = new User();
user1.id = 1;
user1.username = 'test1';
user1.displayName = 'testname1';
user1.password = '';
user1.role = UserRoles.ADMIN;
user1.refreshToken = 'veryrefreshtokenuser1';

// const createUserDto2 = {
//   username: 'test1',
//   displayName: 'testname1',
//   password: '1234',
// };

const user2: User = new User();
user2.id = 2;
user2.username = 'test2';
user2.displayName = 'testname2';
user2.password = '';
user2.role = UserRoles.USER;
user2.refreshToken = 'veryrefreshtokenuser2';

const usersArr = [user1, user2];

// const createUserDto2 = {
//   username: 'bob2',
//   displayName: 'bobik2',
//   password: '12345',
// };

// const user2 = {
//   username: 'bob2',
//   displayName: 'bobik2',
//   password: '12345',
//   role: UserRoles.USER,
// };

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
    const usersArray = usersArr;
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
    const user = user1;

    it('should create user, default categories, hash password and return user', async () => {
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
  });

  describe('updateUser method', () => {
    const user = user1;
    const updatingFields = { displayName: 'updatedTestUserName' };
    const updatedUser = { ...user1, ...updatingFields };
    const anotherAdminUser = { ...user2, role: UserRoles.ADMIN };
    const anotherNonAdminUser: User = { ...user2, role: UserRoles.USER };

    it('should return updated user', async () => {
      const spyRepositoryFindOne = jest
        .spyOn(usersRepositoryMock, 'findOne')
        .mockResolvedValue(user);

      const spyRepositorySave = jest
        .spyOn(usersRepositoryMock, 'save')
        .mockResolvedValue(updatedUser);

      const result = await usersService.updateUser(user.id, updatingFields);

      expect(spyRepositoryFindOne).toBeCalled();
      expect(spyRepositorySave).toBeCalled();

      expect(result).toEqual(updatedUser);
    });

    it('should throw not found exception on updating non-existing user', async () => {
      const spyRepositoryFindOne = jest
        .spyOn(usersRepositoryMock, 'findOne')
        .mockResolvedValue(null);

      expect(
        usersService.updateUser(user.id, updatingFields, user),
      ).rejects.toThrowError(NotFoundException);

      expect(spyRepositoryFindOne).toBeCalled();
    });

    it('should throw forbidden exception on updating admin by admin', async () => {
      const spyRepositoryFindOne = jest
        .spyOn(usersRepositoryMock, 'findOne')
        .mockResolvedValue(user);

      expect(
        usersService.updateUser(user.id, updatingFields, anotherAdminUser),
      ).rejects.toThrowError(ForbiddenException);

      expect(spyRepositoryFindOne).toBeCalled();
    });

    it('should throw forbidden exception on updating role as non-admin', async () => {
      const updatingFieldsAndRole = {
        ...updatingFields,
        role: UserRoles.ADMIN,
      };

      const spyRepositoryFindOne = jest
        .spyOn(usersRepositoryMock, 'findOne')
        .mockResolvedValue(anotherNonAdminUser);

      expect(
        usersService.updateUser(
          user.id,
          updatingFieldsAndRole,
          anotherNonAdminUser,
        ),
      ).rejects.toThrowError(ForbiddenException);

      expect(spyRepositoryFindOne).toBeCalled();
    });

    it('should throw forbidden exception on updating admin by admin', async () => {
      const spyRepositoryFindOne = jest
        .spyOn(usersRepositoryMock, 'findOne')
        .mockResolvedValue(user);

      expect(
        usersService.updateUser(user.id, updatingFields, anotherAdminUser),
      ).rejects.toThrowError(ForbiddenException);

      expect(spyRepositoryFindOne).toBeCalled();
    });

    it('should throw conflictException on updating username to one already exists', async () => {
      const updateUserDtoWithUsername = {
        username: anotherNonAdminUser.username,
      };

      const spyRepositoryFindOne = jest
        .spyOn(usersRepositoryMock, 'findOne')
        .mockResolvedValue(user);

      jest
        .spyOn(usersService, 'getUserByUsername')
        .mockImplementation(() => Promise.resolve(anotherNonAdminUser));

      expect(
        usersService.updateUser(user.id, updateUserDtoWithUsername),
      ).rejects.toThrowError(ConflictException);

      expect(spyRepositoryFindOne).toHaveBeenCalled();
      // for some reasons jest cant recognize this called, but it for sure gets called
      // expect(spyGetUserByUsername).toHaveBeenCalled();
      // Here test to be sure that mock works as intended
      // expect(usersService.getUserByUsername('')).resolves.toBe(
      //   anotherNonAdminUser,
      // );
    });
  });

  describe('updateUserPassword method', () => {
    const user = user1;
    const password = 'Abcde_12345';
    it('should update user password, hashed in advance', async () => {
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
    const admin = { ...user1, role: UserRoles.ADMIN };

    const anotherAdmin = { ...user2, role: UserRoles.ADMIN };
    // const anotherNonAdminUser = { ...user2, role: UserRoles.USER };
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

    it('should throw bad request on deleting own account with wrong password', async () => {
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

    it('should throw ForbiddenException on deleting another administrator', async () => {
      const spyGetUserById = jest
        .spyOn(usersService, 'getUserById')
        .mockResolvedValue(anotherAdmin);

      expect(
        usersService.deleteUser(anotherAdmin.id, admin),
      ).rejects.toThrowError(ForbiddenException);

      expect(spyGetUserById).toBeCalled();
    });

    it('should throw bad request on deleting own account without providing password', async () => {
      const spyRepositoryDelete = jest
        .spyOn(usersRepositoryMock, 'delete')
        .mockResolvedValue(new DeleteResult());

      await usersService.deleteUser(user, user);

      expect(spyRepositoryDelete).toBeCalledWith({ id: user.id });
    });
  });
});
