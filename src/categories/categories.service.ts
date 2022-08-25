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
import { TransactionsService } from 'src/transactions/transactions.service';
import { User, UserRoles } from 'src/users/user.entity';
import type { Repository } from 'typeorm';
import { Category, otherCategory } from './category.entity';
import { DefaultCategory } from './default-categories.entity';
import type { CreateCategoryDto } from './dto/create-category.dto';
import type { UpdateCategoryDto } from './dto/update-category.dto';
import type { UpdateDefaultCategoriesDto } from './dto/update-default-categories';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoriesRepository: Repository<Category>,
    @InjectRepository(DefaultCategory)
    private defaultCategoriesRepository: Repository<DefaultCategory>,
    @Inject(forwardRef(() => TransactionsService))
    private transactionsService: TransactionsService,
  ) {}

  async getAllCategories(): Promise<Category[]> {
    return this.categoriesRepository.find();
  }

  async getCategory(id: number, questioner: User): Promise<Category | null> {
    if (questioner.role === UserRoles.ADMIN) {
      return this.getCategoryById(id, questioner);
    }
    return this.getUserCategoryById(questioner, id);
  }

  async getCategoryById(
    id: number,
    questioner: User,
  ): Promise<Category | null> {
    if (id === otherCategory.id) {
      return this.getUserOtherCategory(questioner);
    }

    return this.categoriesRepository.findOne({
      where: { id },
      relations: { transactions: true, user: true },
    });
  }

  async getCategoryByLabel(
    label: string,
    questioner: User,
  ): Promise<Category | null> {
    // check case for other
    if (label === otherCategory.label) {
      return this.getUserOtherCategory(questioner);
    }
    return this.categoriesRepository.findOne({
      where: { label },
      relations: { transactions: true },
    });
  }

  async getUserCategories(user: User): Promise<Category[]> {
    const categories = await this.categoriesRepository.find({
      where: { user },
      relations: { transactions: true },
    });

    const otherCategory = await this.getUserOtherCategory(user);

    return [...categories, otherCategory];
  }

  async getUserCategoryById(user: User, id: number): Promise<Category | null> {
    return this.categoriesRepository.findOne({
      where: { user, id },
      relations: { transactions: true, user: true },
    });
  }

  async getUserCategoryByLabel(
    user: User,
    label: string,
  ): Promise<Category | null> {
    if (label === otherCategory.label) {
      return this.getUserOtherCategory(user);
    }

    return this.categoriesRepository.findOne({
      where: { user, label },
      relations: { transactions: true },
    });
  }

  async getUserOtherCategory(user: User): Promise<Category> {
    const transactions =
      await this.transactionsService.getUserOtherCategoryTransactions(user);
    return { ...otherCategory, transactions } as Category;
  }

  async createCategory(
    user: User,
    createCategoryDto: CreateCategoryDto,
  ): Promise<Category> {
    const existingCategory = await this.getUserCategoryByLabel(
      user,
      createCategoryDto.label,
    );

    if (existingCategory) {
      throw new ConflictException('Category with this label already exists');
    }

    const category = this.categoriesRepository.create(createCategoryDto);
    category.user = user;
    return this.categoriesRepository.save(category);
  }

  async createDefaultCategories(user: User): Promise<Category[]> {
    // cache defaultCategories for better performance
    if (!defaultCategoriesFetched) {
      defaultCategories = (await this.defaultCategoriesRepository.find()).map(
        (category) => category.label,
      );
      defaultCategoriesFetched = true;
    }

    const defaultCategoriesLabels = defaultCategories;

    const categories = this.categoriesRepository.create([
      ...defaultCategoriesLabels.map((category) => ({ label: category, user })),
    ]);

    return this.categoriesRepository.save(categories);
  }

  async updateCategory(
    id: number,
    updateCategoryDto: UpdateCategoryDto,
    questioner: User,
  ): Promise<Category> {
    const category =
      questioner.role !== UserRoles.ADMIN
        ? await this.getUserCategoryById(questioner, id)
        : await this.getCategoryById(id, questioner);

    if (!category) {
      throw new NotFoundException(
        'Category you want to update does not exists',
      );
    }

    if (category.label === otherCategory.label) {
      throw new BadRequestException(
        'You are not allowed to rename this category',
      );
    }

    if (
      questioner.id !== category.user.id &&
      category.user.role === UserRoles.ADMIN
    ) {
      throw new ForbiddenException(
        "You are not allowed to update other Administrator's category",
      );
    }

    if (updateCategoryDto.label && updateCategoryDto.label !== category.label) {
      const categoryWithSameLabel = await this.getUserCategoryByLabel(
        category.user,
        updateCategoryDto.label,
      );
      if (categoryWithSameLabel) {
        throw new ConflictException(
          'You already have category with this label, please choose another label',
        );
      }
    }

    return this.categoriesRepository.save({
      ...category,
      ...updateCategoryDto,
    });
  }

  async deleteCategory(id: number, questioner: User): Promise<null> {
    const category =
      questioner.role !== UserRoles.ADMIN
        ? await this.getUserCategoryById(questioner, id)
        : await this.getCategoryById(id, questioner);

    if (!category) {
      throw new NotFoundException(
        'Category you want to delete does not exists',
      );
    }

    if (category?.label === otherCategory.label) {
      throw new BadRequestException(
        `You are not allowed to delete this category`,
      );
    }

    if (
      questioner &&
      questioner.id !== category.user.id &&
      category.user.role === UserRoles.ADMIN
    ) {
      throw new ForbiddenException(
        'You are not allowed to delete category of another Administrator ',
      );
    }

    await this.categoriesRepository.delete({ id });

    return null;
  }

  getDefaultCategories(): string[] {
    return defaultCategories;
  }

  async updateDefaultCategories({
    categories,
  }: UpdateDefaultCategoriesDto): Promise<string[]> {
    await this.defaultCategoriesRepository.delete({});

    const filteredCategories = categories.filter(
      (category) => category !== otherCategory.label,
    );

    const defaultCategoriesEntities = this.defaultCategoriesRepository.create(
      filteredCategories.map((category) => ({ label: category })),
    );
    const result = await this.defaultCategoriesRepository
      .save(defaultCategoriesEntities)
      .then((result) => result.map((category) => category.label));

    defaultCategories = result;

    return result;
  }
}

let defaultCategories: string[] = [];
let defaultCategoriesFetched = false;
