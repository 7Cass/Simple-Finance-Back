import { IsString, IsEnum, IsNumber, IsOptional, MinLength } from 'class-validator';
import { AccountType } from '../../../shared/types/enums';

export class CreateBankAccountDto {
    @IsString()
    @MinLength(2)
    name: string;

    @IsEnum(AccountType)
    type: AccountType;

    @IsNumber()
    @IsOptional()
    initialBalance?: number; // in reais, defaults to 0
}
