import {
    IsString,
    IsNumber,
    IsEnum,
    IsDateString,
    IsOptional,
    IsBoolean,
    IsInt,
    Min,
    Max,
    MinLength,
    ValidateIf,
} from 'class-validator';
import { TransactionType, PaymentMethod, RecurrenceRule } from '../../../shared/types/enums';

export class CreateTransactionDto {
    @IsString()
    @MinLength(2)
    description: string;

    @IsNumber()
    @Min(0.01)
    amount: number; // in reais, always positive

    @IsEnum(TransactionType)
    type: TransactionType;

    @IsEnum(PaymentMethod)
    paymentMethod: PaymentMethod;

    @IsDateString()
    date: string;

    // Optional relationships
    @IsString()
    @IsOptional()
    categoryId?: string;

    @IsString()
    @ValidateIf((o) => o.paymentMethod === PaymentMethod.DEBIT || o.paymentMethod === PaymentMethod.TRANSFER)
    bankAccountId?: string;

    @IsString()
    @ValidateIf((o) => o.paymentMethod === PaymentMethod.CREDIT_CARD)
    creditCardId?: string;

    // Installments (only for CREDIT_CARD)
    @IsInt()
    @Min(1)
    @Max(100)
    @IsOptional()
    installments?: number;

    // Recurrence
    @IsBoolean()
    @IsOptional()
    isRecurring?: boolean;

    @IsEnum(RecurrenceRule)
    @ValidateIf((o) => o.isRecurring === true)
    recurrenceRule?: RecurrenceRule;

    @IsDateString()
    @IsOptional()
    recurrenceEndDate?: string;
}
