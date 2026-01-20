import { Controller, Post, Body, Get, Delete } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { DeleteAccountDto } from './dto/delete-account.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Public()
    @Post('register')
    async register(@Body() dto: RegisterDto) {
        return this.authService.register(dto);
    }

    @Public()
    @Post('login')
    async login(@Body() dto: LoginDto) {
        return this.authService.login(dto);
    }

    @Get('profile')
    async getProfile(@CurrentUser() user: { id: string }) {
        return this.authService.getProfile(user.id);
    }

    @Delete('me')
    async deleteAccount(
        @CurrentUser() user: { id: string },
        @Body() deleteAccountDto: DeleteAccountDto
    ) {
        return this.authService.deleteUser(user.id, deleteAccountDto);
    }
}
