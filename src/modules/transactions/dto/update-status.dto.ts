import { IsEnum } from 'class-validator';
import { TransactionStatus } from '../../../shared/types/enums';

export class UpdateStatusDto {
    @IsEnum(TransactionStatus)
    status: TransactionStatus;
}
