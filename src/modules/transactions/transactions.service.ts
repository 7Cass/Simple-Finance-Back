import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { Money } from '../../shared/value-objects/money.vo';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { TransactionFiltersDto } from './dto/transaction-filters.dto';
import { PaymentMethod, TransactionStatus, TransactionType } from '../../shared/types/enums';

@Injectable()
export class TransactionsService {
    constructor(private prisma: PrismaService) { }

    async create(dto: CreateTransactionDto, userId: string) {
        // Validate payment method requirements
        this.validatePaymentMethod(dto);

        const amountCents = Money.fromReais(dto.amount).getCents();

        // Validate credit card limit for EXPENSE transactions
        if (dto.paymentMethod === PaymentMethod.CREDIT_CARD && dto.type === TransactionType.EXPENSE && dto.creditCardId) {
            await this.validateCreditCardLimit(dto.creditCardId, amountCents, dto.installments);
        }

        // Simple transaction (no installments)
        if (!dto.installments || dto.installments === 1) {
            return this.createSingleTransaction(dto, amountCents, userId);
        }

        // Installment transaction (only for CREDIT_CARD)
        if (dto.paymentMethod !== PaymentMethod.CREDIT_CARD) {
            throw new BadRequestException('Installments are only allowed for credit card transactions');
        }

        return this.createInstallmentTransactions(dto, amountCents, userId);
    }

    private async createSingleTransaction(dto: CreateTransactionDto, amountCents: number, userId: string) {
        // Determine initial status
        // DEBIT, CASH, TRANSFER are completed immediately and reflect on balance
        // CREDIT_CARD stays PENDING until bill is processed
        const status = [PaymentMethod.DEBIT, PaymentMethod.CASH, PaymentMethod.TRANSFER].includes(dto.paymentMethod)
            ? TransactionStatus.COMPLETED
            : TransactionStatus.PENDING;

        const transaction = await this.prisma.transaction.create({
            data: {
                description: dto.description,
                amountCents,
                type: dto.type,
                paymentMethod: dto.paymentMethod,
                date: new Date(dto.date),
                status,
                isInstallment: false,
                isRecurring: dto.isRecurring || false,
                recurrenceRule: dto.recurrenceRule,
                recurrenceEndDate: dto.recurrenceEndDate ? new Date(dto.recurrenceEndDate) : null,
                categoryId: dto.categoryId,
                bankAccountId: dto.bankAccountId,
                creditCardId: dto.creditCardId,
                userId,
            },
            include: {
                category: true,
                bankAccount: true,
                creditCard: true,
            },
        });

        // Update bank account balance immediately for DEBIT/CASH/TRANSFER
        if (status === TransactionStatus.COMPLETED && transaction.bankAccountId) {
            await this.updateBankAccountBalance(transaction, true);
        }

        return this.formatTransaction(transaction);
    }

    private async createInstallmentTransactions(dto: CreateTransactionDto, totalAmountCents: number, userId: string) {
        const installmentAmountCents = Math.round(totalAmountCents / dto.installments!);
        const transactions: any[] = [];

        let parentId: string | null = null;

        for (let i = 1; i <= dto.installments!; i++) {
            const installmentDate = this.addMonths(new Date(dto.date), i - 1);

            const transaction = await this.prisma.transaction.create({
                data: {
                    description: `${dto.description} (${i}/${dto.installments})`,
                    amountCents: installmentAmountCents,
                    type: dto.type,
                    paymentMethod: dto.paymentMethod,
                    date: installmentDate,
                    status: TransactionStatus.PENDING,
                    isInstallment: true,
                    installmentNumber: i,
                    totalInstallments: dto.installments,
                    parentId: parentId,
                    categoryId: dto.categoryId,
                    creditCardId: dto.creditCardId,
                    userId,
                },
                include: {
                    category: true,
                    creditCard: true,
                },
            });

            // First transaction becomes the parent
            if (i === 1) {
                parentId = transaction.id;
                // Update the first transaction to point to itself as parent
                await this.prisma.transaction.update({
                    where: { id: transaction.id },
                    data: { parentId: transaction.id },
                });
            }

            transactions.push(this.formatTransaction(transaction));
        }

        return transactions;
    }

    async findAll(userId: string, filters?: TransactionFiltersDto) {
        const where: any = { userId };

        // Soft delete filtering - padrão exclui deleted
        if (!filters?.includeDeleted) {
            where.deleted = false;
        }

        if (filters?.type) where.type = filters.type;
        if (filters?.paymentMethod) where.paymentMethod = filters.paymentMethod;
        if (filters?.status) where.status = filters.status;
        if (filters?.categoryId) where.categoryId = filters.categoryId;
        if (filters?.bankAccountId) where.bankAccountId = filters.bankAccountId;
        if (filters?.creditCardId) where.creditCardId = filters.creditCardId;
        if (filters?.isInstallment !== undefined) where.isInstallment = filters.isInstallment;

        if (filters?.startDate || filters?.endDate) {
            where.date = {};
            if (filters.startDate) where.date.gte = new Date(filters.startDate);
            if (filters.endDate) where.date.lte = new Date(filters.endDate);
        }

        const transactions = await this.prisma.transaction.findMany({
            where,
            include: {
                category: true,
                bankAccount: true,
                creditCard: true,
            },
            orderBy: { date: 'desc' },
        });

        return transactions.map((t) => this.formatTransaction(t));
    }

    async findOne(id: string, userId: string) {
        const transaction = await this.prisma.transaction.findFirst({
            where: { id, userId, deleted: false },
            include: {
                category: true,
                bankAccount: true,
                creditCard: true,
            },
        });

        if (!transaction) {
            throw new NotFoundException('Transaction not found');
        }

        return this.formatTransaction(transaction);
    }

    async update(id: string, dto: UpdateTransactionDto, userId: string) {
        const transaction = await this.prisma.transaction.findUnique({
            where: { id },
        });

        if (!transaction) {
            throw new NotFoundException('Transaction not found');
        }

        if (transaction.deleted) {
            throw new NotFoundException('Transaction not found');
        }

        if (transaction.userId !== userId) {
            throw new ForbiddenException('Cannot edit transactions from other users');
        }

        const amountCents = dto.amount ? Money.fromReais(dto.amount).getCents() : undefined;

        const updatedTransaction = await this.prisma.transaction.update({
            where: { id },
            data: {
                description: dto.description,
                amountCents,
                type: dto.type,
                paymentMethod: dto.paymentMethod,
                date: dto.date ? new Date(dto.date) : undefined,
                categoryId: dto.categoryId,
            },
            include: {
                category: true,
                bankAccount: true,
                creditCard: true,
            },
        });

        return this.formatTransaction(updatedTransaction);
    }

    async updateStatus(id: string, dto: UpdateStatusDto, userId: string) {
        const transaction = await this.prisma.transaction.findUnique({
            where: { id },
            include: { bankAccount: true },
        });

        if (!transaction) {
            throw new NotFoundException('Transaction not found');
        }

        if (transaction.deleted) {
            throw new NotFoundException('Transaction not found');
        }

        if (transaction.userId !== userId) {
            throw new ForbiddenException('Cannot edit transactions from other users');
        }

        const previousStatus = transaction.status;

        // Update transaction status
        const updatedTransaction = await this.prisma.transaction.update({
            where: { id },
            data: { status: dto.status },
            include: {
                category: true,
                bankAccount: true,
                creditCard: true,
            },
        });

        // Update bank account balance if needed
        if (transaction.bankAccountId && dto.status === TransactionStatus.COMPLETED && previousStatus !== TransactionStatus.COMPLETED) {
            await this.updateBankAccountBalance(transaction, true);
        } else if (transaction.bankAccountId && previousStatus === TransactionStatus.COMPLETED && dto.status !== TransactionStatus.COMPLETED) {
            // Reverse the balance update
            await this.updateBankAccountBalance(transaction, false);
        }

        return this.formatTransaction(updatedTransaction);
    }

    async remove(id: string, userId: string) {
        const transaction = await this.prisma.transaction.findUnique({
            where: { id },
        });

        if (!transaction) {
            throw new NotFoundException('Transaction not found');
        }

        if (transaction.userId !== userId) {
            throw new ForbiddenException('Cannot delete transactions from other users');
        }

        if (transaction.deleted) {
            throw new NotFoundException('Transaction not found');
        }

        // Se é parent de installments, soft delete todos os filhos
        if (transaction.isInstallment && transaction.parentId === transaction.id) {
            await this.prisma.transaction.updateMany({
                where: { parentId: transaction.id },
                data: {
                    deleted: true,
                    deletedAt: new Date(),
                },
            });
        } else {
            await this.prisma.transaction.update({
                where: { id },
                data: {
                    deleted: true,
                    deletedAt: new Date(),
                },
            });
        }

        return { message: 'Transaction deleted successfully' };
    }

    private async updateBankAccountBalance(transaction: any, isAdding: boolean) {
        if (!transaction.bankAccountId) return;

        const account = await this.prisma.bankAccount.findUnique({
            where: { id: transaction.bankAccountId },
        });

        if (!account) return;

        const currentBalance = Money.fromCents(account.balanceCents);
        const transactionAmount = Money.fromCents(transaction.amountCents);

        let newBalance: Money;

        if (transaction.type === TransactionType.INCOME) {
            newBalance = isAdding ? currentBalance.add(transactionAmount) : currentBalance.subtract(transactionAmount);
        } else {
            // EXPENSE
            newBalance = isAdding ? currentBalance.subtract(transactionAmount) : currentBalance.add(transactionAmount);
        }

        await this.prisma.bankAccount.update({
            where: { id: transaction.bankAccountId },
            data: { balanceCents: newBalance.getCents() },
        });
    }

    private validatePaymentMethod(dto: CreateTransactionDto) {
        if (dto.paymentMethod === PaymentMethod.CREDIT_CARD && !dto.creditCardId) {
            throw new BadRequestException('creditCardId is required for credit card transactions');
        }

        if ((dto.paymentMethod === PaymentMethod.DEBIT || dto.paymentMethod === PaymentMethod.TRANSFER) && !dto.bankAccountId) {
            throw new BadRequestException('bankAccountId is required for debit/transfer transactions');
        }

        if (dto.isRecurring && !dto.recurrenceRule) {
            throw new BadRequestException('recurrenceRule is required for recurring transactions');
        }
    }

    private async validateCreditCardLimit(creditCardId: string, amountCents: number, installments?: number) {
        const creditCard = await this.prisma.creditCard.findUnique({
            where: { id: creditCardId },
        });

        if (!creditCard) {
            throw new NotFoundException('Credit card not found');
        }

        if (creditCard.deleted) {
            throw new BadRequestException('Cannot use deleted credit card');
        }

        // Calculate current usage from pending transactions
        const pendingTransactions = await this.prisma.transaction.findMany({
            where: {
                creditCardId,
                status: TransactionStatus.PENDING,
                deleted: false,
            },
        });

        const currentUsageCents = pendingTransactions.reduce(
            (sum, txn) => sum + txn.amountCents,
            0
        );

        // For installments, validate only the first installment amount
        const transactionAmountCents = installments && installments > 1
            ? Math.round(amountCents / installments)
            : amountCents;

        const totalUsageCents = currentUsageCents + transactionAmountCents;

        if (totalUsageCents > creditCard.limitCents) {
            const limitReais = Money.fromCents(creditCard.limitCents).getReais();
            const usageReais = Money.fromCents(totalUsageCents).getReais();
            throw new BadRequestException(
                `Credit card limit exceeded. Limit: R$ ${limitReais.toFixed(2)}, Required: R$ ${usageReais.toFixed(2)}`
            );
        }
    }

    private formatTransaction(transaction: any) {
        return {
            id: transaction.id,
            description: transaction.description,
            amount: transaction.amountCents, // Returns in cents
            type: transaction.type,
            paymentMethod: transaction.paymentMethod,
            date: transaction.date,
            status: transaction.status,
            isInstallment: transaction.isInstallment,
            installmentNumber: transaction.installmentNumber,
            totalInstallments: transaction.totalInstallments,
            isRecurring: transaction.isRecurring,
            recurrenceRule: transaction.recurrenceRule,
            recurrenceEndDate: transaction.recurrenceEndDate,
            category: transaction.category,
            bankAccount: transaction.bankAccount ? {
                id: transaction.bankAccount.id,
                name: transaction.bankAccount.name,
            } : null,
            creditCard: transaction.creditCard ? {
                id: transaction.creditCard.id,
                name: transaction.creditCard.name,
            } : null,
            userId: transaction.userId,
            createdAt: transaction.createdAt,
            updatedAt: transaction.updatedAt,
        };
    }

    private addMonths(date: Date, months: number): Date {
        const result = new Date(date);
        result.setMonth(result.getMonth() + months);
        return result;
    }
}
