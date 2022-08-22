import { ApiHideProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { Category, otherCategory } from 'src/categories/category.entity';
import { User } from 'src/users/user.entity';
import {
  Column,
  Entity,
  EntitySubscriberInterface,
  EventSubscriber,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'transactions' })
export class Transaction {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  label!: string;

  @Column({ type: 'date' })
  date!: Date;

  @Column({ type: 'real' })
  amount!: number;

  @ApiHideProperty()
  @Exclude()
  @ManyToOne(() => Category, (category) => category.transactions, {
    onDelete: 'SET NULL',
  })
  category?: Category;

  @ApiHideProperty()
  @Exclude()
  @ManyToOne(() => User, (user) => user.transactions, { onDelete: 'CASCADE' })
  user!: User;
}

@EventSubscriber()
export class TransactionSubscriber
  implements EntitySubscriberInterface<Transaction>
{
  listenTo(): typeof Transaction {
    return Transaction;
  }

  afterLoad(transaction: Transaction): void {
    transaction.category =
      transaction.category ??
      ({ ...otherCategory, user: transaction.user } as Category);
  }
}
