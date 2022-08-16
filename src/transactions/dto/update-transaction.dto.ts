import { Type } from 'class-transformer';
import {
  IsDate,
  IsNumber,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

export class UpdateTransactionDto {
  @IsOptional()
  @IsString({ message: 'label must be a string' })
  @Length(2, 50, {
    message: 'label length must be in between 2 and 50 symbols',
  })
  label?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'date must be a date in format YYYY-MM-DD' })
  date?: Date;

  @IsOptional()
  @IsNumber({}, { message: 'amount must be a number' })
  amount?: number;

  @IsOptional()
  @IsString({ message: 'categoryLabel must be a string' })
  categoryLabel?: string;
}
