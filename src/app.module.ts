import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env?.['DATABASE_URL'],
      entities: [],
      synchronize: true,
      ssl: true,
      extra: {
        ssl: { rejectUnauthorized: false },
      },
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}