import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    Query,
} from '@nestjs/common';
import { PetsService } from './pets.service';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/enums/role.enum';
import { PetSpecies } from '../../common/enums/species.enum';

@UseGuards(JwtAuthGuard)
@Controller('pets')
export class PetsController {
    constructor(private readonly petsService: PetsService) { }

    /**
     * POST /pets
     * Access: OWNER (creates for self), ADMIN (can designate ownerId)
     * VET cannot create pet records — only the owner or admin can register a pet.
     */
    @UseGuards(RolesGuard)
    @Roles(UserRole.OWNER, UserRole.ADMIN)
    @Post()
    create(
        @Body() createPetDto: CreatePetDto,
        @CurrentUser('userId') userId: string,
        @CurrentUser('role') userRole: UserRole,
    ) {
        return this.petsService.create(createPetDto, userId, userRole);
    }

    /**
     * GET /pets?species=DOG
     * Access: ALL authenticated users (OWNER, VET, ADMIN)
     * Scoping: OWNER sees only their own pets. VET and ADMIN see all.
     */
    @Get()
    findAll(
        @CurrentUser('userId') userId: string,
        @CurrentUser('role') userRole: UserRole,
        @Query('species') species?: PetSpecies,
    ) {
        return this.petsService.findAll(userId, userRole, species);
    }

    /**
     * GET /pets/:id
     * Access: ALL authenticated users (OWNER, VET, ADMIN)
     * Scoping: OWNER can only view their own pet. ForbiddenException otherwise.
     */
    @Get(':id')
    findOne(
        @Param('id') id: string,
        @CurrentUser('userId') userId: string,
        @CurrentUser('role') userRole: UserRole,
    ) {
        return this.petsService.findOne(id, userId, userRole);
    }

    /**
     * PATCH /pets/:id
     * Access: OWNER (own pets only), ADMIN (any pet)
    * VET cannot update pet profile data — only medical case records.
     */
    @UseGuards(RolesGuard)
    @Roles(UserRole.OWNER, UserRole.ADMIN)
    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body() updatePetDto: UpdatePetDto,
        @CurrentUser('userId') userId: string,
        @CurrentUser('role') userRole: UserRole,
    ) {
        return this.petsService.update(id, updatePetDto, userId, userRole);
    }

    /**
     * DELETE /pets/:id
     * Access: OWNER (own pets only), ADMIN (any pet)
     * VET has NO delete permission — a vet should never remove a pet's history.
     */
    @UseGuards(RolesGuard)
    @Roles(UserRole.OWNER, UserRole.ADMIN)
    @Delete(':id')
    remove(
        @Param('id') id: string,
        @CurrentUser('userId') userId: string,
        @CurrentUser('role') userRole: UserRole,
    ) {
        return this.petsService.remove(id, userId, userRole);
    }
}