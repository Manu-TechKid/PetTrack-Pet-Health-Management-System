import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { DiseasesService } from './diseases.service';
import { CreateDiseaseDto } from './dto/create-disease.dto';
import { SymptomCheckDto } from './dto/symptom-check.dto';
import { PetSpecies } from '../../common/enums/species.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/role.enum';

@UseGuards(JwtAuthGuard)
@Controller('diseases')
export class DiseasesController {
    constructor(private readonly diseasesService: DiseasesService) { }


    /**
     * POST /diseases (Add disease record) 
     *  Access: (Authenticated: ADMIN)
     *  Restricted to Admins
     */
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @Post()
    create(@Body() createDiseaseDto: CreateDiseaseDto) {
        return this.diseasesService.create(createDiseaseDto);
    }

    /** 
     * POST /diseases/symptom-check (Run Symptom Checker)
     *  Access:(Authenticated: OWNER, VET, ADMIN)
     *  calculate the match confidence and triage guidance based on the matched symptoms and risk level
     */
    @UseGuards(JwtAuthGuard)
    @Post('symptom-check')
    checkSymptoms(@Body() symptomCheckDto: SymptomCheckDto) {
        return this.diseasesService.checkSymptoms(symptomCheckDto);
    }

    /** 
     * GET /diseases?species=DOG 
     *  Access: (Authenticated: OWNER, VET, ADMIN)
     *  Purpose: Browse all diseases or filter by species (DOG, CAT, BIRD, OTHER)
     */
    @UseGuards(JwtAuthGuard)
    @Get()
    findAll(@Query('species') species?: PetSpecies) {
        return this.diseasesService.findAll(species);
    }

    /** 
     * GET /diseases/:id (View single disease)
     *  Access: (Authenticated: OWNER, VET, ADMIN)
     *  Purpose: View full clinical details of a specific disease by its ID
     */
    @UseGuards(JwtAuthGuard)
    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.diseasesService.findOne(id);
    }
}