import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('categories')
export class CategoriesController {
    constructor(private readonly categoriesService: CategoriesService) { }

    @Post()
    create(
        @Body() createCategoryDto: CreateCategoryDto,
        @CurrentUser() user: { id: string },
    ) {
        return this.categoriesService.create(createCategoryDto, user.id);
    }

    @Get()
    findAll(@CurrentUser() user: { id: string }) {
        return this.categoriesService.findAll(user.id);
    }

    @Get(':id')
    findOne(@Param('id') id: string, @CurrentUser() user: { id: string }) {
        return this.categoriesService.findOne(id, user.id);
    }

    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body() updateCategoryDto: UpdateCategoryDto,
        @CurrentUser() user: { id: string },
    ) {
        return this.categoriesService.update(id, updateCategoryDto, user.id);
    }

    @Delete(':id')
    remove(@Param('id') id: string, @CurrentUser() user: { id: string }) {
        return this.categoriesService.remove(id, user.id);
    }
}
