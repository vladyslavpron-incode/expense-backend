import { Module } from '@nestjs/common';
// import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './users/user.entity';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TransactionsModule } from './transactions/transactions.module';
import {
  Transaction,
  TransactionSubscriber,
} from './transactions/transaction.entity';
import { CategoriesModule } from './categories/categories.module';
import { Category } from './categories/category.entity';
import { Config, configSchema } from './utils/config';
import { DefaultCategory } from './categories/default-categories.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      isGlobal: true,
      validationSchema: configSchema,
    }),
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService<Config, true>) => ({
        type: 'postgres',
        url: configService.get('DATABASE_URL'),
        entities: [User, Category, Transaction, DefaultCategory],
        subscribers: [TransactionSubscriber],
        synchronize: true,
        ssl: true,
        extra: {
          ssl: { rejectUnauthorized: false },
        },
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    AuthModule,
    CategoriesModule,
    TransactionsModule,
  ],
})
export class AppModule {}
