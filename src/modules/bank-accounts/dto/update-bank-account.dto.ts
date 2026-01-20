import { IsString, IsEnum, IsOptional, MinLength } from 'class-validator';
import { AccountType } from '../../../shared/types/enums';

export class UpdateBankAccountDto {
    @IsString()
    @MinLength(2)
    @IsOptional()
    name?: string;

    @IsEnum(AccountType)
    @IsOptional()
    type?: AccountType;
}
