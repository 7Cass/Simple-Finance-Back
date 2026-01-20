import { IsString, IsEnum, IsOptional, MinLength } from 'class-validator';
import { TransactionType } from '../../../shared/types/enums';

export class CreateCategoryDto {
    @IsString()
    @MinLength(2)
    name: string;

    @IsEnum(TransactionType)
    type: TransactionType;

    @IsString()
    @IsOptional()
    icon?: string;

    @IsString()
    @IsOptional()
    color?: string;
}
