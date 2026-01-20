import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { Money } from '../../shared/value-objects/money.vo';
import { CreateCreditCardDto } from './dto/create-credit-card.dto';
import { UpdateCreditCardDto } from './dto/update-credit-card.dto';

@Injectable()
export class CreditCardsService {
    constructor(private prisma: PrismaService) { }

    async create(dto: CreateCreditCardDto, userId: string) {
        const limitCents = Money.fromReais(dto.limit).getCents();

        const card = await this.prisma.creditCard.create({
            data: {
                name: dto.name,
                lastFourDigits: dto.lastFourDigits,
                limitCents,
                closingDay: dto.closingDay,
                dueDay: dto.dueDay,
                userId,
            },
        });

        return this.formatCard(card);
    }

    async findAll(userId: string, includeDeleted: boolean = false) {
        const cards = await this.prisma.creditCard.findMany({
            where: {
                userId,
                deleted: includeDeleted ? undefined : false
            },
            orderBy: { createdAt: 'desc' },
        });

        return cards.map((card) => this.formatCard(card));
    }

    async findOne(id: string, userId: string) {
        const card = await this.prisma.creditCard.findFirst({
            where: { id, userId, deleted: false },
        });

        if (!card) {
            throw new NotFoundException('Credit card not found');
        }

        return this.formatCard(card);
    }

    async update(id: string, dto: UpdateCreditCardDto, userId: string) {
        const card = await this.prisma.creditCard.findUnique({
            where: { id },
        });

        if (!card) {
            throw new NotFoundException('Credit card not found');
        }

        if (card.deleted) {
            throw new NotFoundException('Credit card not found');
        }

        if (card.userId !== userId) {
            throw new ForbiddenException('Cannot edit credit cards from other users');
        }

        const limitCents = dto.limit ? Money.fromReais(dto.limit).getCents() : undefined;

        const updatedCard = await this.prisma.creditCard.update({
            where: { id },
            data: {
                name: dto.name,
                lastFourDigits: dto.lastFourDigits,
                limitCents,
                closingDay: dto.closingDay,
                dueDay: dto.dueDay,
            },
        });

        return this.formatCard(updatedCard);
    }

    async remove(id: string, userId: string) {
        const card = await this.prisma.creditCard.findUnique({
            where: { id },
        });

        if (!card) {
            throw new NotFoundException('Credit card not found');
        }

        if (card.userId !== userId) {
            throw new ForbiddenException('Cannot delete credit cards from other users');
        }

        if (card.deleted) {
            throw new NotFoundException('Credit card not found');
        }

        // Soft delete card
        await this.prisma.creditCard.update({
            where: { id },
            data: {
                deleted: true,
                deletedAt: new Date(),
            },
        });

        // Soft delete associated transactions
        await this.prisma.transaction.updateMany({
            where: { creditCardId: id },
            data: {
                deleted: true,
                deletedAt: new Date(),
            },
        });

        return { message: 'Credit card deleted successfully' };
    }

    async restore(id: string, userId: string) {
        const card = await this.prisma.creditCard.findUnique({
            where: { id },
        });

        if (!card) {
            throw new NotFoundException('Credit card not found');
        }

        if (card.userId !== userId) {
            throw new ForbiddenException('Cannot restore credit cards from other users');
        }

        if (!card.deleted) {
            throw new ConflictException('Credit card is not deleted');
        }

        const restoredCard = await this.prisma.creditCard.update({
            where: { id },
            data: {
                deleted: false,
                deletedAt: null,
            },
        });

        // Restore associated transactions
        await this.prisma.transaction.updateMany({
            where: { creditCardId: id },
            data: {
                deleted: false,
                deletedAt: null,
            },
        });

        return this.formatCard(restoredCard);
    }

    private formatCard(card: any) {
        return {
            id: card.id,
            name: card.name,
            lastFourDigits: card.lastFourDigits,
            limit: card.limitCents, // Returns in cents
            closingDay: card.closingDay,
            dueDay: card.dueDay,
            userId: card.userId,
            createdAt: card.createdAt,
            updatedAt: card.updatedAt,
        };
    }
}
