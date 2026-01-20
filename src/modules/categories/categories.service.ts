import {
    Injectable,
    NotFoundException,
    ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
    constructor(private prisma: PrismaService) { }

    async create(dto: CreateCategoryDto, userId: string) {
        const category = await this.prisma.category.create({
            data: {
                name: dto.name,
                type: dto.type,
                icon: dto.icon,
                color: dto.color,
                userId,
                isDefault: false,
            },
        });

        return category;
    }

    async findAll(userId: string) {
        // Return both default categories and user's custom categories
        const categories = await this.prisma.category.findMany({
            where: {
                OR: [
                    { userId: null, isDefault: true }, // Default categories
                    { userId }, // User's custom categories
                ],
            },
            orderBy: [
                { isDefault: 'desc' }, // Default categories first
                { name: 'asc' },
            ],
        });

        return categories;
    }

    async findOne(id: string, userId: string) {
        const category = await this.prisma.category.findFirst({
            where: {
                id,
                OR: [
                    { userId: null, isDefault: true },
                    { userId },
                ],
            },
        });

        if (!category) {
            throw new NotFoundException('Category not found');
        }

        return category;
    }

    async update(id: string, dto: UpdateCategoryDto, userId: string) {
        const category = await this.prisma.category.findUnique({
            where: { id },
        });

        if (!category) {
            throw new NotFoundException('Category not found');
        }

        // Cannot edit default categories
        if (category.isDefault) {
            throw new ForbiddenException('Cannot edit default categories');
        }

        // Can only edit own categories
        if (category.userId !== userId) {
            throw new ForbiddenException('Cannot edit categories from other users');
        }

        const updatedCategory = await this.prisma.category.update({
            where: { id },
            data: {
                name: dto.name,
                type: dto.type,
                icon: dto.icon,
                color: dto.color,
            },
        });

        return updatedCategory;
    }

    async remove(id: string, userId: string) {
        const category = await this.prisma.category.findUnique({
            where: { id },
        });

        if (!category) {
            throw new NotFoundException('Category not found');
        }

        // Cannot delete default categories
        if (category.isDefault) {
            throw new ForbiddenException('Cannot delete default categories');
        }

        // Can only delete own categories
        if (category.userId !== userId) {
            throw new ForbiddenException('Cannot delete categories from other users');
        }

        await this.prisma.category.delete({
            where: { id },
        });

        return { message: 'Category deleted successfully' };
    }
}
