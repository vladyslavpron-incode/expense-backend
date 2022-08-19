import {
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CategoriesService } from 'src/categories/categories.service';
import { User, UserRoles } from 'src/users/user.entity';
import type { FindOptionsRelations, Repository } from 'typeorm';
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

  async getUserTransactions(user: User): Promise<Transaction[]> {
    return this.transactionsRepository.find({
      where: { user },
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

  async getUserTransactionById(
    user: User,
    id: number,
  ): Promise<Transaction | null> {
    return this.transactionsRepository.findOne({ where: { user, id } });
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
    transaction.category = category;

    return this.transactionsRepository.save(transaction);
  }

  async updateTransaction(
    id: number,
    updateTransactionDto: UpdateTransactionDto,
    user?: User,
    questioner?: User,
  ): Promise<Transaction> {
    const transaction = user
      ? await this.getUserTransactionById(user, id)
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

  async deleteTransactionById(id: number, questioner?: User): Promise<null> {
    if (!questioner) {
      const result = await this.transactionsRepository.delete({ id });

      if (!result.affected) {
        throw new NotFoundException(
          'Transaction you want to delete does not exists',
        );
      }

      return null;
    } else {
      const transaction = await this.getTransactionById(id, { user: true });
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
}
