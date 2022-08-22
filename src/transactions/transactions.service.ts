import {
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CategoriesService } from 'src/categories/categories.service';
import { otherCategory } from 'src/categories/category.entity';
import { User, UserRoles } from 'src/users/user.entity';
import { FindOptionsRelations, IsNull, Repository } from 'typeorm';
import type { CreateTransactionDto } from './dto/create-transaction.dto';
import type { UpdateTransactionDto } from './dto/update-transaction.dto';
import { Transaction } from './transaction.entity';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private transactionsRepository: Repository<Transaction>,
    @Inject(forwardRef(() => CategoriesService))
    private readonly categoriesService: CategoriesService,
  ) {}

  async getAllTransactions(): Promise<Transaction[]> {
    return this.transactionsRepository.find();
  }

  async getTransaction(
    id: number,
    questioner: User,
  ): Promise<Transaction | null> {
    if (questioner.role === UserRoles.ADMIN) {
      return this.getTransactionById(id);
    }
    return this.getUserTransactionById(questioner, id);
  }

  async getUserTransactions(user: User): Promise<Transaction[]> {
    return this.transactionsRepository.find({
      where: { user },
      relations: { category: true },
    });
  }

  async getTransactionById(
    id: number,
    relations?: FindOptionsRelations<Transaction>,
  ): Promise<Transaction | null> {
    return this.transactionsRepository.findOne({
      where: { id },
      relations,
    });
  }

  async getUserOtherCategoryTransactions(user: User): Promise<Transaction[]> {
    return this.transactionsRepository
      .createQueryBuilder()
      .where({ category: IsNull(), user })
      .getMany();
    // for unknown reasons isNull() does not work properly on .find
    // return this.transactionsRepository.find({
    //   where: { category: {}, user },
    //   relations: { category: true },
    // });
  }

  async getUserTransactionById(
    user: User,
    id: number,
  ): Promise<Transaction | null> {
    return this.transactionsRepository.findOne({
      where: { user, id },
      relations: { user: true },
    });
  }

  async createTransaction(
    user: User,
    createTransactionDto: CreateTransactionDto,
  ): Promise<Transaction> {
    const category = await this.categoriesService.getUserCategoryByLabel(
      user,
      createTransactionDto.categoryLabel,
    );

    if (!category) {
      throw new NotFoundException(
        'Category you want to create transaction for does not exists',
      );
    }

    const transaction =
      this.transactionsRepository.create(createTransactionDto);

    transaction.user = user;
    transaction.category =
      category.label === otherCategory.label ? undefined : category;

    return this.transactionsRepository.save(transaction);
  }

  async updateTransaction(
    id: number,
    updateTransactionDto: UpdateTransactionDto,
    questioner: User,
  ): Promise<Transaction> {
    const transaction =
      questioner.role !== UserRoles.ADMIN
        ? await this.getUserTransactionById(questioner, id)
        : await this.getTransactionById(id, { user: true });

    if (!transaction) {
      throw new NotFoundException(
        'Transaction you want to update does not exists',
      );
    }
    if (
      questioner &&
      questioner.id !== transaction.user.id &&
      transaction.user.role === UserRoles.ADMIN
    ) {
      throw new ForbiddenException(
        "You can't update transactions of another Administrator",
      );
    }
    if (updateTransactionDto.categoryLabel) {
      const category = await this.categoriesService.getUserCategoryByLabel(
        transaction.user,
        updateTransactionDto.categoryLabel,
      );

      if (!category) {
        throw new NotFoundException(
          'Category you want to move transaction to does not exists',
        );
      }
      transaction.category = category;
    }

    return this.transactionsRepository.save({
      ...transaction,
      ...updateTransactionDto,
    });
  }

  async deleteTransaction(id: number, questioner: User): Promise<null> {
    const transaction =
      questioner.role !== UserRoles.ADMIN
        ? await this.getUserTransactionById(questioner, id)
        : await this.getTransactionById(id, { user: true });

    if (!transaction) {
      throw new NotFoundException(
        'Transaction you want to delete does not exists',
      );
    }
    if (
      questioner.id !== transaction.user.id &&
      transaction.user.role === UserRoles.ADMIN
    ) {
      throw new ForbiddenException(
        'You are not allowed to delete transaction of another Administrator',
      );
    }
    await this.transactionsRepository.delete({ id });
    return null;
  }
}
