import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { AuthUser } from 'src/auth/decorators/user.decorator';
import { AccessAuthGuard } from 'src/auth/guards/access-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserRoles } from './user.entity';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(AccessAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('all')
  @ApiOperation({ summary: 'Get all users' })
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
  @ApiOperation({ summary: 'Get user by id' })
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
  updateCurrentUser(
    @AuthUser() user: User,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    return this.usersService.updateUser(user.id, updateUserDto);
  }

  @Patch(':userId')
  @ApiOperation({ summary: 'Update user by id' })
  @UseGuards(RolesGuard)
  @Roles(UserRoles.ADMIN)
  updateUser(
    @Param('userId') userId: number,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    return this.usersService.updateUser(userId, updateUserDto);
  }

  @Delete()
  @ApiOperation({ summary: 'Delete current user' })
  deleteCurrentUser(@AuthUser() user: User): Promise<null> {
    return this.usersService.deleteUserById(user.id);
  }

  @Delete(':userId')
  @ApiOperation({ summary: 'Delete user by id' })
  @UseGuards(RolesGuard)
  @Roles(UserRoles.ADMIN)
  deleteUser(@Param('userId') userId: number): Promise<null> {
    return this.usersService.deleteUserById(userId);
  }
}
