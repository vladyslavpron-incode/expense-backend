import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CategoriesService } from 'src/categories/categories.service';
import { category1 } from 'src/categories/categories.stubs';
import { Category, otherCategory } from 'src/categories/category.entity';

import { admin1, admin2, user1 } from 'src/users/users.stubs';
import { DeleteResult, IsNull, Repository } from 'typeorm';
import type { CreateTransactionDto } from './dto/create-transaction.dto';
import { Transaction } from './transaction.entity';
import { TransactionsService } from './transactions.service';
import {
  createTransactionDto1,
  transaction1,
  transactions,
  updateTransactionDto1,
} from './transactions.stubs';

describe('TransactionsService', () => {
  let transactionsService: TransactionsService;
  let transactionsRepositoryMock: Repository<Transaction>;

  const categoriesServiceMock = {
    getUserCategoryByLabel: jest.fn(),
  };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        { provide: getRepositoryToken(Transaction), useClass: Repository },
        { provide: CategoriesService, useValue: categoriesServiceMock },
      ],
    }).compile();

    transactionsService = app.get<TransactionsService>(TransactionsService);
    transactionsRepositoryMock = app.get<Repository<Transaction>>(
      getRepositoryToken(Transaction),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllTransactions method', () => {
    const transactionsArray = transactions;

    it('should return array of transactions', async () => {
      const spyRepositoryFind = jest
        .spyOn(transactionsRepositoryMock, 'find')
        .mockResolvedValue(transactionsArray);

      const result = await transactionsService.getAllTransactions();

      expect(spyRepositoryFind).toHaveBeenCalled();
      expect(result).toEqual(transactionsArray);
    });
  });

  describe('getTransaction method', () => {
    const transaction = transaction1;
    const user = user1;
    const admin = admin1;

    it('should return transaction of same user when asked by user', async () => {
      const spyGetUserTransactionById = jest
        .spyOn(transactionsService, 'getUserTransactionById')
        .mockResolvedValue(transaction);

      const result = await transactionsService.getTransaction(
        transaction.id,
        user,
      );

      expect(spyGetUserTransactionById).toHaveBeenCalled();
      expect(result).toEqual(transaction);
    });

    it('should return any transaction when asked by admin', async () => {
      const spyGetTransactionById = jest
        .spyOn(transactionsService, 'getTransactionById')
        .mockResolvedValue(transaction);

      const result = await transactionsService.getTransaction(
        transaction.id,
        admin,
      );

      expect(spyGetTransactionById).toHaveBeenCalled();
      expect(result).toEqual(transaction);
    });
  });

  describe('getUserTransactions method', () => {
    const user = user1;
    const userTransactionsArray = transactions.map((transaction) => ({
      ...transaction,
      user,
    }));

    it('should return array of transactions of user', async () => {
      const spyRepositoryFind = jest
        .spyOn(transactionsRepositoryMock, 'find')
        .mockResolvedValue(userTransactionsArray);

      const result = await transactionsService.getUserTransactions(user);

      expect(spyRepositoryFind).toBeCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ user }) }),
      );
      expect(result).toEqual(userTransactionsArray);
    });
  });

  describe('getTransactionById method', () => {
    const transaction = transaction1;

    it('should return transaction', async () => {
      const spyRepositoryFindOne = jest
        .spyOn(transactionsRepositoryMock, 'findOne')
        .mockResolvedValue(transaction);

      const result = await transactionsService.getTransactionById(
        transaction.id,
      );

      expect(spyRepositoryFindOne).toBeCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: transaction.id }),
        }),
      );
      expect(result).toEqual(transaction);
    });
  });

  describe('getUserOtherCategoryTransactions method', () => {
    const user = user1;
    const transactionsArray = transactions;

    it('should return transaction for other category (with category null)', async () => {
      /* eslint-disable  @typescript-eslint/no-explicit-any */
      const createQueryBuilderMock: any = {
        where: jest.fn().mockImplementation(() => {
          return createQueryBuilderMock;
        }),
        getMany: jest.fn().mockResolvedValue(transactionsArray),
      };

      jest
        .spyOn(transactionsRepositoryMock, 'createQueryBuilder')
        .mockImplementationOnce(() => createQueryBuilderMock);

      const result = await transactionsService.getUserOtherCategoryTransactions(
        user,
      );

      expect(createQueryBuilderMock.where).toHaveBeenCalledWith(
        expect.objectContaining({
          user,
          category: IsNull(),
        }),
      );
      expect(createQueryBuilderMock.getMany).toHaveBeenCalled();
      expect(result).toEqual(transactionsArray);
    });
  });

  describe('getUserTransactionById method', () => {
    const transaction = transaction1;
    const user = user1;

    it('should return transaction of user', async () => {
      const spyRepositoryFindOne = jest
        .spyOn(transactionsRepositoryMock, 'findOne')
        .mockResolvedValue(transaction);

      const result = await transactionsService.getUserTransactionById(
        user,
        transaction.id,
      );

      expect(spyRepositoryFindOne).toBeCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: transaction.id, user }),
        }),
      );
      expect(result).toEqual(transaction);
    });
  });

  describe('createTransaction method', () => {
    // transaction will be populated with user and category
    const transaction = { ...transaction1 };
    const createTransactionDto = createTransactionDto1;

    const category = category1;
    const user = user1;

    it('should create transaction, assign user and category and save', async () => {
      const spyGetUserCategoryByLabel = jest
        .spyOn(categoriesServiceMock, 'getUserCategoryByLabel')
        .mockImplementation(() => Promise.resolve(category));

      const spyRepositoryCreate = jest
        .spyOn(transactionsRepositoryMock, 'create')
        .mockReturnValue(transaction);

      const spyRepositorySave = jest
        .spyOn(transactionsRepositoryMock, 'save')
        .mockResolvedValue(transaction);

      const result = await transactionsService.createTransaction(
        user,
        createTransactionDto,
      );

      expect(spyGetUserCategoryByLabel).toBeCalled();
      expect(spyRepositoryCreate).toBeCalled();
      expect(spyRepositorySave).toBeCalledWith(
        expect.objectContaining({ user, category }),
      );

      expect(result).toEqual(transaction);
    });

    it('should create transaction, assign user and set category undefined when categoryLabel is otherCategory label, then save', async () => {
      const createTransactionDtoCategoryLabelOther: CreateTransactionDto = {
        ...createTransactionDto1,
        categoryLabel: otherCategory.label,
      };
      const userOtherCategory = { ...otherCategory, user } as Category;
      const expectedResult = { ...transaction, user, category: undefined };

      const spyGetUserCategoryByLabel = jest
        .spyOn(categoriesServiceMock, 'getUserCategoryByLabel')
        .mockImplementation(() => Promise.resolve(userOtherCategory));

      const spyRepositoryCreate = jest
        .spyOn(transactionsRepositoryMock, 'create')
        .mockReturnValue(transaction);

      const spyRepositorySave = jest
        .spyOn(transactionsRepositoryMock, 'save')
        .mockResolvedValue(expectedResult);

      const result = await transactionsService.createTransaction(
        user,
        createTransactionDtoCategoryLabelOther,
      );

      expect(spyGetUserCategoryByLabel).toBeCalled();
      expect(spyRepositoryCreate).toBeCalled();
      expect(spyRepositorySave).toBeCalledWith(
        expect.objectContaining({ user, category: undefined }),
      );

      expect(result).toEqual(expectedResult);
    });

    it('should throw NotFoundException when user does not have category with categoryLabel', async () => {
      jest
        .spyOn(categoriesServiceMock, 'getUserCategoryByLabel')
        .mockImplementation(() => Promise.resolve(null));

      expect(
        transactionsService.createTransaction(user, createTransactionDto),
      ).rejects.toThrowError(NotFoundException);
    });
  });

  describe('updateTransaction method', () => {
    // transaction will be populated with category
    const user = user1;
    const admin = admin1;
    const anotherAdmin = admin2;
    const category = category1;
    const transaction = { ...transaction1 };
    const updateTransactionDto = updateTransactionDto1;
    const updatedTransaction = {
      ...transaction,
      ...updateTransactionDto,
      categoryLabel: undefined,
      category,
    };

    it('should update user transaction when asked its owner and reassign category with corresponding label', async () => {
      const spyGetUserCategoryByLabel = jest
        .spyOn(categoriesServiceMock, 'getUserCategoryByLabel')
        .mockImplementation(() => Promise.resolve(category));

      const spyGetUserTransactionById = jest
        .spyOn(transactionsService, 'getUserTransactionById')
        .mockImplementation(() => Promise.resolve(transaction));

      const spyRepositorySave = jest
        .spyOn(transactionsRepositoryMock, 'save')
        .mockResolvedValue(updatedTransaction);

      const result = await transactionsService.updateTransaction(
        transaction.id,
        updateTransactionDto,
        user,
      );

      expect(spyGetUserTransactionById).toBeCalled();
      expect(spyGetUserCategoryByLabel).toBeCalled();
      expect(spyRepositorySave).toBeCalledWith(
        expect.objectContaining({
          ...transaction,
          category,
          ...updateTransactionDto,
        }),
      );
      expect(result).toEqual(updatedTransaction);
    });

    it('should update any non-admin transaction when asked by admin and reassign category with corresponding label', async () => {
      const spyGetUserCategoryByLabel = jest
        .spyOn(categoriesServiceMock, 'getUserCategoryByLabel')
        .mockImplementation(() => Promise.resolve(category));

      const spyGetTransactionById = jest
        .spyOn(transactionsService, 'getTransactionById')
        .mockImplementation(() => Promise.resolve(transaction));

      const spyRepositorySave = jest
        .spyOn(transactionsRepositoryMock, 'save')
        .mockResolvedValue(updatedTransaction);

      const result = await transactionsService.updateTransaction(
        transaction.id,
        updateTransactionDto,
        admin,
      );

      expect(spyGetTransactionById).toBeCalled();
      expect(spyGetUserCategoryByLabel).toBeCalled();
      expect(spyRepositorySave).toBeCalledWith(
        expect.objectContaining({
          ...transaction,
          category,
          ...updateTransactionDto,
        }),
      );
      expect(result).toEqual(updatedTransaction);
    });

    it('should throw NotFoundException if user does not have category with categoryLabel', async () => {
      const spyGetUserCategoryByLabel = jest
        .spyOn(categoriesServiceMock, 'getUserCategoryByLabel')
        .mockImplementation(() => Promise.resolve(null));

      const spyGetUserTransactionById = jest
        .spyOn(transactionsService, 'getUserTransactionById')
        .mockImplementation(() => Promise.resolve(transaction));

      await expect(() =>
        transactionsService.updateTransaction(
          transaction.id,
          updateTransactionDto,
          user,
        ),
      ).rejects.toThrowError(NotFoundException);

      expect(spyGetUserTransactionById).toBeCalled();
      expect(spyGetUserCategoryByLabel).toBeCalled();
    });

    it('should throw ForbiddenException on updating admin transaction by another admin', async () => {
      const adminTransaction = { ...transaction, user: admin };

      const spyGetTransactionById = jest
        .spyOn(transactionsService, 'getTransactionById')
        .mockImplementation(() => Promise.resolve(adminTransaction));

      expect(
        transactionsService.updateTransaction(
          transaction.id,
          updateTransactionDto,
          anotherAdmin,
        ),
      ).rejects.toThrowError(ForbiddenException);
      expect(spyGetTransactionById).toBeCalled();
    });

    it('should throw NotFoundException on updating transaction that does not exists', async () => {
      const spyGetUserTransactionById = jest
        .spyOn(transactionsService, 'getUserTransactionById')
        .mockImplementation(() => Promise.resolve(null));

      expect(
        transactionsService.updateTransaction(
          transaction.id,
          updateTransactionDto,
          user,
        ),
      ).rejects.toThrowError(NotFoundException);
      expect(spyGetUserTransactionById).toBeCalled();
    });
  });

  describe('deleteTransaction method', () => {
    const transaction = transaction1;
    const user = user1;
    const admin = admin1;
    const anotherAdmin = admin2;
    const adminTransaction = { ...transaction, user: admin };

    it('should delete transaction of user when asked by its owner', async () => {
      const spyGetUserTransactionById = jest
        .spyOn(transactionsService, 'getUserTransactionById')
        .mockResolvedValue(transaction);

      const spyRepositoryDelete = jest
        .spyOn(transactionsRepositoryMock, 'delete')
        .mockResolvedValue(new DeleteResult());

      await transactionsService.deleteTransaction(transaction.id, user);

      expect(spyRepositoryDelete).toBeCalledWith({
        id: transaction.id,
      });
      expect(spyGetUserTransactionById).toBeCalled();
    });

    it('should delete any non-admin transaction when asked by admin', async () => {
      const spyGetTransactionById = jest
        .spyOn(transactionsService, 'getTransactionById')
        .mockResolvedValue(transaction);

      const spyRepositoryDelete = jest
        .spyOn(transactionsRepositoryMock, 'delete')
        .mockResolvedValue(new DeleteResult());

      await transactionsService.deleteTransaction(transaction.id, admin);

      expect(spyRepositoryDelete).toBeCalledWith({
        id: transaction.id,
      });
      expect(spyGetTransactionById).toBeCalled();
    });

    it('should throw ForbiddenException on deleting admin transaction by another admin', async () => {
      const spyGetTransactionById = jest
        .spyOn(transactionsService, 'getTransactionById')
        .mockResolvedValue(adminTransaction);

      expect(
        transactionsService.deleteTransaction(
          adminTransaction.id,
          anotherAdmin,
        ),
      ).rejects.toThrowError(ForbiddenException);

      expect(spyGetTransactionById).toBeCalled();
    });

    it('should throw NotFoundException on deleting transaction that does not exists', async () => {
      const spyGetUserTransactionById = jest
        .spyOn(transactionsService, 'getUserTransactionById')
        .mockResolvedValue(null);

      expect(
        transactionsService.deleteTransaction(transaction.id, user),
      ).rejects.toThrowError(NotFoundException);

      expect(spyGetUserTransactionById).toBeCalled();
    });
  });
});
