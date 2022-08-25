import { category1, category2 } from 'src/categories/categories.stubs';
import { otherCategory } from 'src/categories/category.entity';
import { user1, user2, user3 } from 'src/users/users.stubs';
import type { CreateTransactionDto } from './dto/create-transaction.dto';
import type { UpdateTransactionDto } from './dto/update-transaction.dto';
import type { Transaction } from './transaction.entity';

export const transaction1: Transaction = Object.freeze({
  id: 1,
  label: 'transactionlabel1',
  date: new Date('2022-08-25'),
  amount: 30,
  user: user1,
  category: category1,
});

export const transaction2: Transaction = Object.freeze({
  id: 2,
  label: 'transactionlabel2',
  date: new Date('2020-04-11'),
  amount: -15,
  user: user2,
  category: category2,
});

export const transaction3: Transaction = Object.freeze({
  id: 3,
  label: 'transactionlabel3',
  date: new Date('2021-12-30'),
  amount: -12.2,
  user: user3,
  category: undefined,
});

export const transactions = [transaction1, transaction2, transaction3];

export const createTransactionDto1: CreateTransactionDto = Object.freeze({
  label: 'createtransactionlabel1',
  date: new Date('2019-12-30'),
  amount: -12.2,
  categoryLabel: category1.label,
});

export const createTransactionDto2: CreateTransactionDto = Object.freeze({
  label: 'createtransactionlabel2',
  date: new Date('2018-11-15'),
  amount: 12.85,
  categoryLabel: category2.label,
});

export const createTransactionDto3: CreateTransactionDto = Object.freeze({
  label: 'createtransactionlabel3',
  date: new Date('2023-01-12'),
  amount: 95,
  categoryLabel: otherCategory.label,
});

export const updateTransactionDto1: UpdateTransactionDto = Object.freeze({
  label: 'updatetransactionlabel1',
  date: new Date('2022-02-22'),
  amount: 120,
  categoryLabel: category1.label,
});
