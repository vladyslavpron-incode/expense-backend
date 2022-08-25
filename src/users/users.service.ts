import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CategoriesService } from 'src/categories/categories.service';
import { ILike, Repository } from 'typeorm';
import { User, UserRoles } from './user.entity';
import bcrypt from 'bcrypt';
import type { CreateUserDto } from './dto/create-user.dto';
import type { UpdateUserDto } from './dto/update-user.dto';
import type { DeleteUserDto } from './dto/delete-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private usersRepository: Repository<User>,
    @Inject(forwardRef(() => CategoriesService))
    private readonly categoriesService: CategoriesService,
  ) {}

  async getAllUsers(): Promise<User[]> {
    return this.usersRepository.find();
  }

  async getUserById(id: number): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { id },
    });
  }

  async getUserByUsername(username: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { username: ILike(username) },
    });
  }

  async getUserByRefreshToken(refreshToken: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { refreshToken } });
  }

  async createUser(createUserDto: CreateUserDto): Promise<User> {
    const user = this.usersRepository.create(createUserDto);

    await this.usersRepository.save(user);

    const categories = await this.categoriesService.createDefaultCategories(
      user,
    );

    if (user.id === 1) {
      user.role = UserRoles.ADMIN;
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    user.password = hashedPassword;

    await this.usersRepository.save({ ...user, categories });
    return user;
  }

  async updateUser(
    user: number | User,
    updateUserDto: UpdateUserDto,
    questioner: User,
  ): Promise<User> {
    if (typeof user === 'number') {
      const getUser = await this.usersRepository.findOne({
        where: { id: user },
      });

      if (!getUser) {
        throw new NotFoundException('User you want to update does not exists');
      }
      user = getUser;
    }

    if (
      questioner &&
      user.id !== questioner?.id &&
      user?.role === UserRoles.ADMIN
    ) {
      throw new ForbiddenException(
        ' You are not allowed to update another Administrator',
      );
    }

    if (updateUserDto.role && user.role !== UserRoles.ADMIN) {
      throw new ForbiddenException(' You are not allowed to change your role');
    }

    if (updateUserDto.username && updateUserDto.username !== user.username) {
      const userWithSameUsername = await this.getUserByUsername(
        updateUserDto.username,
      );

      if (userWithSameUsername)
        throw new ConflictException(
          'Another user with same username already exists, please choose another username',
        );
    }

    return await this.usersRepository.save({
      ...user,
      ...updateUserDto,
    });
  }

  async updateUserPassword(user: User, password: string): Promise<User> {
    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;

    return await this.usersRepository.save(user);
  }

  async updateUserRefreshToken(
    id: number,
    refreshToken: string,
  ): Promise<null> {
    await this.usersRepository.update({ id }, { refreshToken });
    return null;
  }

  async deleteUserRefreshToken(id: number): Promise<null> {
    await this.usersRepository.update({ id }, { refreshToken: '' });
    return null;
  }

  async updateUserLogoutTimestamp(id: number, timestamp: Date): Promise<null> {
    await this.usersRepository.update({ id }, { logoutTimestamp: timestamp });
    return null;
  }

  async deleteUser(
    user: User | number,
    questioner: User,
    deleteUserDto?: DeleteUserDto,
  ): Promise<null> {
    // Admins on request can pass only userId which they want to delete, also they don't have to provide password

    if (typeof user === 'number') {
      if (user === questioner.id) {
        throw new BadRequestException(
          "You can't use this endpoint to delete your account, please use endpoint to delete current account",
        );
      }

      const getUser = await this.getUserById(user);
      if (!getUser) {
        throw new NotFoundException('User you want to delete does not exists');
      }
      user = getUser;
    }

    if (deleteUserDto) {
      const isPasswordCorrect = await bcrypt.compare(
        deleteUserDto.password,
        user.password,
      );
      if (!isPasswordCorrect) {
        throw new BadRequestException('Invalid password');
      }
    }

    if (user.id !== questioner.id && user.role === UserRoles.ADMIN) {
      throw new ForbiddenException("You can't delete another Administrator");
    }

    await this.usersRepository.delete({ id: user.id });
    return null;
  }
}
