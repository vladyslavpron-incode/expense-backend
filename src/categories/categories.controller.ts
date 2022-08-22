import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { Category } from './category.entity';
import { CategoriesService } from './categories.service';
import { AccessAuthGuard } from 'src/auth/guards/access-auth.guard';
import { AuthUser } from 'src/auth/decorators/user.decorator';
import { User, UserRoles } from 'src/users/user.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { UpdateDefaultCategoriesDto } from './dto/update-default-categories';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';

@Controller('categories')
@ApiTags('Categories')
@ApiBearerAuth()
@UseGuards(AccessAuthGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'Get categories of current user' })
  getCurrentUserCategories(@AuthUser() user: User): Promise<Category[]> {
    return this.categoriesService.getUserCategories(user);
  }

  @Get(':categoryId')
  @ApiOperation({ summary: 'Get category by id' })
  @ApiOkResponse({ type: Category })
  getCategory(
    @AuthUser() user: User,
    @Param('categoryId') categoryId: number,
  ): Promise<Category | null> {
    return this.categoriesService.getCategory(categoryId, user);
  }

  // TODO: allow admins to create categories for other users
  @Post()
  @ApiOperation({ summary: 'Create new category for current user' })
  createCurrentUserCategory(
    @AuthUser() user: User,
    @Body() createCategoryDto: CreateCategoryDto,
  ): Promise<Category> {
    return this.categoriesService.createCategory(user, createCategoryDto);
  }

  @Patch(':categoryId')
  @ApiOperation({ summary: 'Update category by id' })
  async updateCategory(
    @AuthUser() user: User,
    @Param('categoryId') categoryId: number,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ): Promise<Category> {
    const result = await this.categoriesService.updateCategory(
      categoryId,
      updateCategoryDto,
      user,
    );
    return plainToInstance(Category, result);
  }

  @Delete(':categoryId')
  @ApiOperation({ summary: 'Delete category by id' })
  deleteCategory(
    @AuthUser() user: User,
    @Param('categoryId') categoryId: number,
  ): Promise<null> {
    return this.categoriesService.deleteCategory(categoryId, user);
  }

  @Put('default')
  @ApiOperation({ summary: 'Update default caterogies (for Administrators)' })
  @ApiOkResponse({ type: UpdateDefaultCategoriesDto })
  @UseGuards(RolesGuard)
  @Roles(UserRoles.ADMIN)
  async updateDefaultCategories(
    @Body()
    dto: UpdateDefaultCategoriesDto,
  ): Promise<{ categories: string[] }> {
    const categories = await this.categoriesService.updateDefaultCategories(
      dto,
    );
    return { categories };
  }
}
