import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { AuthUser } from 'src/auth/decorators/user.decorator';
import { AccessAuthGuard } from 'src/auth/guards/access-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { User, UserRoles } from 'src/users/user.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { Transaction } from './transaction.entity';
import { TransactionsService } from './transactions.service';

@Controller('transactions')
@ApiTags('Transactions')
@ApiBearerAuth()
@UseGuards(AccessAuthGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get('all')
  @ApiOperation({ summary: 'Get all transactions (for Administrators)' })
  @UseGuards(RolesGuard)
  @Roles(UserRoles.ADMIN)
  getAllTransactions(): Promise<Transaction[]> {
    return this.transactionsService.getAllTransactions();
  }

  @Get()
  @ApiOperation({ summary: 'Get transactions of current user' })
  getCurrentUserTransactions(@AuthUser() user: User): Promise<Transaction[]> {
    return this.transactionsService.getUserTransactions(user);
  }

  @Get(':transactionId')
  @ApiOperation({ summary: 'Get transaction by id' })
  @ApiOkResponse({ type: Transaction })
  getTransaction(
    @AuthUser() user: User,
    @Param('transactionId') transactionId: number,
  ): Promise<Transaction | null> {
    return this.transactionsService.getTransaction(transactionId, user);
  }

  // TODO: allow admins to create transactions for other users

  @Post()
  @ApiOperation({ summary: 'Create transaction for current user' })
  @UseGuards(AccessAuthGuard)
  createCurrentUserTransaction(
    @AuthUser() user: User,
    @Body()
    createTransactionDto: CreateTransactionDto,
  ): Promise<Transaction> {
    return this.transactionsService.createTransaction(
      user,
      createTransactionDto,
    );
  }

  @Patch(':transactionId')
  @ApiOperation({ summary: 'Update transaction by id' })
  async updateTransaction(
    @AuthUser() user: User,
    @Param('transactionId') transactionId: number,
    @Body() updateTransactionDto: UpdateTransactionDto,
  ): Promise<Transaction> {
    // transaction only moveable to categories of the same user
    const result = await this.transactionsService.updateTransaction(
      transactionId,
      updateTransactionDto,
      user,
    );

    return plainToInstance(Transaction, result);
  }

  @Delete(':transactionId')
  @ApiOperation({ summary: 'Delete transaction by id' })
  deleteTransaction(
    @AuthUser() user: User,
    @Param('transactionId') transactionId: number,
  ): Promise<null> {
    return this.transactionsService.deleteTransaction(transactionId, user);
  }
}
