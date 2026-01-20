import {
    IsString,
    IsNumber,
    IsEnum,
    IsDateString,
    IsOptional,
    Min,
    MinLength,
} from 'class-validator';
import { TransactionType, PaymentMethod } from '../../../shared/types/enums';

export class UpdateTransactionDto {
    @IsString()
    @MinLength(2)
    @IsOptional()
    description?: string;

    @IsNumber()
    @Min(0.01)
    @IsOptional()
    amount?: number; // in reais

    @IsEnum(TransactionType)
    @IsOptional()
    type?: TransactionType;

    @IsEnum(PaymentMethod)
    @IsOptional()
    paymentMethod?: PaymentMethod;

    @IsDateString()
    @IsOptional()
    date?: string;

    @IsString()
    @IsOptional()
    categoryId?: string;
}
