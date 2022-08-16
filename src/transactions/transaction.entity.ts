import { ApiHideProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { Category } from 'src/categories/category.entity';
import { User } from 'src/users/user.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

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
    onDelete: 'CASCADE',
  })
  category!: Category;

  @ApiHideProperty()
  @Exclude()
  @ManyToOne(() => User, (user) => user.transactions)
  user!: User;
}
