import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
} from '@nestjs/common';
import { CreditCardsService } from './credit-cards.service';
import { CreateCreditCardDto } from './dto/create-credit-card.dto';
import { UpdateCreditCardDto } from './dto/update-credit-card.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('credit-cards')
export class CreditCardsController {
    constructor(private readonly creditCardsService: CreditCardsService) { }

    @Post()
    create(
        @Body() createCreditCardDto: CreateCreditCardDto,
        @CurrentUser() user: { id: string },
    ) {
        return this.creditCardsService.create(createCreditCardDto, user.id);
    }

    @Get()
    findAll(
        @CurrentUser() user: { id: string },
        @Query('includeDeleted') includeDeleted?: boolean
    ) {
        return this.creditCardsService.findAll(user.id, includeDeleted);
    }

    @Get(':id')
    findOne(@Param('id') id: string, @CurrentUser() user: { id: string }) {
        return this.creditCardsService.findOne(id, user.id);
    }

    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body() updateCreditCardDto: UpdateCreditCardDto,
        @CurrentUser() user: { id: string },
    ) {
        return this.creditCardsService.update(id, updateCreditCardDto, user.id);
    }

    @Delete(':id')
    remove(@Param('id') id: string, @CurrentUser() user: { id: string }) {
        return this.creditCardsService.remove(id, user.id);
    }

    @Patch(':id/restore')
    restore(
        @Param('id') id: string,
        @CurrentUser() user: { id: string },
    ) {
        return this.creditCardsService.restore(id, user.id);
    }
}
