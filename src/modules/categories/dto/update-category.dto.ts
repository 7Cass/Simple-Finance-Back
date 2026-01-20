import { IsString, IsEnum, IsOptional, MinLength } from 'class-validator';
import { TransactionType } from '../../../shared/types/enums';

export class UpdateCategoryDto {
    @IsString()
    @MinLength(2)
    @IsOptional()
    name?: string;

    @IsEnum(TransactionType)
    @IsOptional()
    type?: TransactionType;

    @IsString()
    @IsOptional()
    icon?: string;

    @IsString()
    @IsOptional()
    color?: string;
}
