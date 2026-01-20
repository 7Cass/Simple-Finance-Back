import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { Money } from '../../shared/value-objects/money.vo';
import { CreateBankAccountDto } from './dto/create-bank-account.dto';
import { UpdateBankAccountDto } from './dto/update-bank-account.dto';
import { UpdateBalanceDto } from './dto/update-balance.dto';

@Injectable()
export class BankAccountsService {
    constructor(private prisma: PrismaService) { }

    async create(dto: CreateBankAccountDto, userId: string) {
        const balanceCents = Money.fromReais(dto.initialBalance || 0).getCents();

        const account = await this.prisma.bankAccount.create({
            data: {
                name: dto.name,
                type: dto.type,
                balanceCents,
                userId,
            },
        });

        return this.formatAccount(account);
    }

    async findAll(userId: string, includeDeleted: boolean = false) {
        const accounts = await this.prisma.bankAccount.findMany({
            where: {
                userId,
                deleted: includeDeleted ? undefined : false
            },
            orderBy: { createdAt: 'desc' },
        });

        return accounts.map((account) => this.formatAccount(account));
    }

    async findOne(id: string, userId: string) {
        const account = await this.prisma.bankAccount.findFirst({
            where: { id, userId, deleted: false },
        });

        if (!account) {
            throw new NotFoundException('Bank account not found');
        }

        return this.formatAccount(account);
    }

    async update(id: string, dto: UpdateBankAccountDto, userId: string) {
        const account = await this.prisma.bankAccount.findUnique({
            where: { id },
        });

        if (!account) {
            throw new NotFoundException('Bank account not found');
        }

        if (account.deleted) {
            throw new NotFoundException('Bank account not found');
        }

        if (account.userId !== userId) {
            throw new ForbiddenException('Cannot edit bank accounts from other users');
        }

        const updatedAccount = await this.prisma.bankAccount.update({
            where: { id },
            data: {
                name: dto.name,
                type: dto.type,
            },
        });

        return this.formatAccount(updatedAccount);
    }

    async updateBalance(id: string, dto: UpdateBalanceDto, userId: string) {
        const account = await this.prisma.bankAccount.findUnique({
            where: { id },
        });

        if (!account) {
            throw new NotFoundException('Bank account not found');
        }

        if (account.deleted) {
            throw new NotFoundException('Bank account not found');
        }

        if (account.userId !== userId) {
            throw new ForbiddenException('Cannot edit bank accounts from other users');
        }

        const balanceCents = Money.fromReais(dto.balance).getCents();

        const updatedAccount = await this.prisma.bankAccount.update({
            where: { id },
            data: { balanceCents },
        });

        return this.formatAccount(updatedAccount);
    }

    async remove(id: string, userId: string) {
        const account = await this.prisma.bankAccount.findUnique({
            where: { id },
        });

        if (!account) {
            throw new NotFoundException('Bank account not found');
        }

        if (account.userId !== userId) {
            throw new ForbiddenException('Cannot delete bank accounts from other users');
        }

        if (account.deleted) {
            throw new NotFoundException('Bank account not found');
        }

        // Soft delete account
        await this.prisma.bankAccount.update({
            where: { id },
            data: {
                deleted: true,
                deletedAt: new Date(),
            },
        });

        // Soft delete associated transactions
        await this.prisma.transaction.updateMany({
            where: { bankAccountId: id },
            data: {
                deleted: true,
                deletedAt: new Date(),
            },
        });

        return { message: 'Bank account deleted successfully' };
    }

    async restore(id: string, userId: string) {
        const account = await this.prisma.bankAccount.findUnique({
            where: { id },
        });

        if (!account) {
            throw new NotFoundException('Bank account not found');
        }

        if (account.userId !== userId) {
            throw new ForbiddenException('Cannot restore bank accounts from other users');
        }

        if (!account.deleted) {
            throw new ConflictException('Bank account is not deleted');
        }

        const restoredAccount = await this.prisma.bankAccount.update({
            where: { id },
            data: {
                deleted: false,
                deletedAt: null,
            },
        });

        // Restore associated transactions
        await this.prisma.transaction.updateMany({
            where: { bankAccountId: id },
            data: {
                deleted: false,
                deletedAt: null,
            },
        });

        return this.formatAccount(restoredAccount);
    }

    private formatAccount(account: any) {
        return {
            id: account.id,
            name: account.name,
            type: account.type,
            balance: account.balanceCents, // Returns in cents
            userId: account.userId,
            createdAt: account.createdAt,
            updatedAt: account.updatedAt,
        };
    }
}
