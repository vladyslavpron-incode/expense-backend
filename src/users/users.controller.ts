import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { AuthUser } from 'src/auth/decorators/user.decorator';
import { AccessAuthGuard } from 'src/auth/guards/access-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { DeleteUserDto } from './dto/delete-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserRoles } from './user.entity';
import { UsersService } from './users.service';

@Controller('users')
@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(AccessAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('all')
  @ApiOperation({
    summary: 'Get all users (for Administrators)',
  })
  @UseGuards(RolesGuard)
  @Roles(UserRoles.ADMIN)
  getUsers(): Promise<User[]> {
    return this.usersService.getAllUsers();
  }

  @Get()
  @ApiOperation({ summary: 'Get current user' })
  getCurrentUser(@AuthUser() user: User): User {
    return user;
  }

  @Get(':userId')
  @ApiOperation({
    summary: 'Get user by id (for Administrators)',
  })
  @ApiOkResponse({ type: User })
  @UseGuards(RolesGuard)
  @Roles(UserRoles.ADMIN)
  getUser(@Param('userId') userId: number): Promise<User | null> {
    return this.usersService.getUserById(userId);
  }

  // There is auth/register route for proper registration
  // @Post()
  // createUser(@Body() user: User): Promise<User> {
  //   return this.usersService.createUser(user);
  // }

  @Patch()
  @ApiOperation({ summary: 'Update current user' })
  async updateCurrentUser(
    @AuthUser() user: User,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    const result = await this.usersService.updateUser(
      user.id,
      updateUserDto,
      user,
    );
    return plainToInstance(User, result);
  }

  @Patch(':userId')
  @ApiOperation({ summary: 'Update user by id (for Administrators)' })
  @UseGuards(RolesGuard)
  @Roles(UserRoles.ADMIN)
  async updateUser(
    @AuthUser() user: User,
    @Param('userId') userId: number,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    const result = await this.usersService.updateUser(
      userId,
      updateUserDto,
      user,
    );
    return plainToInstance(User, result);
  }

  @Delete()
  @ApiOperation({ summary: 'Delete current user' })
  deleteCurrentUser(
    @AuthUser() user: User,
    @Body() deleteUserDto: DeleteUserDto,
  ): Promise<null> {
    return this.usersService.deleteUser(user, user, deleteUserDto);
  }

  @Delete(':userId')
  @ApiOperation({ summary: 'Delete user by id (for Administrators)' })
  @UseGuards(RolesGuard)
  @Roles(UserRoles.ADMIN)
  deleteUser(
    @AuthUser() user: User,
    @Param('userId') userId: number,
  ): Promise<null> {
    return this.usersService.deleteUser(userId, user);
  }
}
