import { IsBoolean, IsOptional, IsDateString, IsEnum, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { TransactionType, PaymentMethod, TransactionStatus } from '../../../shared/types/enums';

export class TransactionFiltersDto {
  @IsBoolean()
  @Type(() => Boolean)
  @IsOptional()
  includeDeleted?: boolean = false;

  @IsEnum(TransactionType)
  @IsOptional()
  type?: TransactionType;

  @IsEnum(PaymentMethod)
  @IsOptional()
  paymentMethod?: PaymentMethod;

  @IsEnum(TransactionStatus)
  @IsOptional()
  status?: TransactionStatus;

  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsString()
  @IsOptional()
  bankAccountId?: string;

  @IsString()
  @IsOptional()
  creditCardId?: string;

  @IsBoolean()
  @Type(() => Boolean)
  @IsOptional()
  isInstallment?: boolean;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;
}
