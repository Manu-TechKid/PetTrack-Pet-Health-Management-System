import { Controller, Get, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    // GET /users/profile (Protected by JwtAuthGuard)
    @UseGuards(JwtAuthGuard)
    @Get('profile')
    async getProfile(@CurrentUser('userId') userId: string) {
        return this.usersService.findById(userId);
    }
}