import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { Category } from 'src/categories/category.entity';
import { Transaction } from 'src/transactions/transaction.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

export enum UserRoles {
  ADMIN = 'Administrator',
  USER = 'User',
}

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @ApiProperty()
  @Column({ unique: true })
  username!: string;

  @Column()
  displayName!: string;

  @Column({
    type: 'enum',
    enum: UserRoles,
    default: UserRoles.USER,
  })
  role!: UserRoles;

  @ApiHideProperty()
  @Exclude()
  @Column({ length: '100' })
  password!: string;

  @ApiHideProperty()
  @Exclude()
  @Column({ nullable: true })
  refreshToken!: string;

  @ApiHideProperty()
  @Exclude()
  @Column({ type: 'timestamp with time zone', nullable: true })
  logoutTimestamp!: Date;

  @ApiHideProperty()
  @OneToMany(() => Category, (category) => category.user, {
    cascade: true,
  })
  categories!: Category[];

  @ApiHideProperty()
  @OneToMany(() => Transaction, (transaction) => transaction.user)
  transactions!: Transaction[];
}
