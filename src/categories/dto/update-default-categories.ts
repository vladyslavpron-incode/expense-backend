import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsDefined, IsNotEmpty, IsString } from 'class-validator';

export class UpdateDefaultCategoriesDto {
  @IsDefined({ message: 'categories must be defined' })
  @IsNotEmpty({ message: 'categories must be not empty' })
  @IsArray({ message: 'Categories must be array' })
  @IsString({ message: 'Each category can only be string', each: true })
  @ApiProperty()
  categories!: string[];
}
