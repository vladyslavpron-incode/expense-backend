import type { CreateUserDto } from './dto/create-user.dto';
import type { UpdateUserDto } from './dto/update-user.dto';
import { User, UserRoles } from './user.entity';

export const createUserDto1: CreateUserDto = Object.freeze({
  username: 'usernameuser1',
  displayName: 'testuser1',
  password: 'Password__1234',
});

export const createUserDto2: CreateUserDto = Object.freeze({
  username: 'usernameuser2',
  displayName: 'testuser2',
  password: 'QODWKoko--123',
});

export const createUserDto3: CreateUserDto = Object.freeze({
  username: 'usernameuser3',
  displayName: 'testuser3',
  password: 'WDjddnndw1200123.1',
});

export const updateUserDto1: UpdateUserDto = {
  username: 'someupdatedusername',
  displayName: 'someupdateddisplayname',
};

export const createUserDtos = [createUserDto1, createUserDto2, createUserDto3];

export const user1: User = Object.freeze(
  Object.create({
    id: 1,
    username: 'usernameuser1',
    displayName: 'testuser1',
    password: '',
    role: UserRoles.USER,
    refreshToken: 'veryrefreshtokenuser1',
    logoutTimestamp: null,
  }),
);

export const user2: User = Object.freeze(
  Object.create({
    id: 2,
    username: 'usernameuser2',
    displayName: 'testuser2',
    password: '',
    role: UserRoles.USER,
    refreshToken: 'veryrefreshtokenuser2',
    logoutTimestamp: null,
  }),
);

export const user3: User = Object.freeze(
  Object.create({
    id: 3,
    username: 'test3',
    displayName: 'testuser3',
    password: '',
    role: UserRoles.USER,
    refreshToken: 'veryrefreshtokenuser3',
    logoutTimestamp: null,
  }),
);

export const users = [user1, user2, user3];

export const admin1: User = Object.freeze(
  Object.create({
    id: 1001,
    username: 'usernameadmin1',
    displayName: 'testadmin1',
    password: '',
    role: UserRoles.ADMIN,
    refreshToken: 'veryrefreshtokenadmin1',
    logoutTimestamp: null,
  }),
);

export const admin2: User = Object.freeze(
  Object.create({
    id: 1002,
    username: 'usernameadmin2',
    displayName: 'testadmin2',
    password: '',
    role: UserRoles.ADMIN,
    refreshToken: 'veryrefreshtokenadmin2',
    logoutTimestamp: null,
  }),
);

export const admin3: User = Object.freeze(
  Object.create({
    id: 1003,
    username: 'usernameadmin3',
    displayName: 'testadmin3',
    password: '',
    role: UserRoles.ADMIN,
    refreshToken: 'veryrefreshtokenadmin3',
    logoutTimestamp: null,
  }),
);

export const admins = [admin1, admin2, admin3];
