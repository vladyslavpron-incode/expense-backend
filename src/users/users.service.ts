import {
  BadRequestException,
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CategoriesService } from 'src/categories/categories.service';
import type { Repository } from 'typeorm';
import { User, UserRoles } from './user.entity';
import bcrypt from 'bcrypt';
import type { CreateUserDto } from './dto/create-user.dto';
import type { UpdateUserDto } from './dto/update-user.dto';

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
    return this.usersRepository.findOne({ where: { username } });
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

    const hashedPassword = await bcrypt.hash(createUserDto.password, 5);
    user.password = hashedPassword;

    await this.usersRepository.save({ ...user, categories });
    return user;
  }

  async updateUser(
    id: number,
    updateUserDto: UpdateUserDto,
    questioner?: User,
  ): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });

    if (!user) {
      throw new BadRequestException('User you want to update does not exists');
    }

    if (questioner && id !== questioner?.id && user?.role === UserRoles.ADMIN) {
      throw new BadRequestException(
        ' You are not allowed to update another Administrator',
      );
    }

    if (updateUserDto.role && user.role !== UserRoles.ADMIN) {
      throw new BadRequestException(' You are not allowed to change your role');
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

    const hashedPassword = updateUserDto.password
      ? await bcrypt.hash(updateUserDto.password, 5)
      : undefined;

    return await this.usersRepository.save({
      ...user,
      ...updateUserDto,
      password: hashedPassword || user.password,
    });
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

  async deleteUserById(id: number, questioner?: User): Promise<null> {
    if (!questioner) {
      const result = await this.usersRepository.delete({ id });

      if (!result.affected) {
        throw new BadRequestException(
          'User you want to delete does not exists',
        );
      }

      return null;
    } else {
      const user = await this.getUserById(id);

      if (!user) {
        throw new BadRequestException(
          'User you want to delete does not exists',
        );
      }

      if (user.id !== questioner.id && user.role === UserRoles.ADMIN) {
        throw new BadRequestException("You can't delete another Administrator");
      }
      await this.usersRepository.delete({ id });
      return null;
    }
  }
}
