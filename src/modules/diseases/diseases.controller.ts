import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { DiseasesService } from './diseases.service';
import { CreateDiseaseDto } from './dto/create-disease.dto';
import { SymptomCheckDto } from './dto/symptom-check.dto';
import { PetSpecies } from '../../common/enums/species.enum';

@Controller('diseases')
export class DiseasesController {
    constructor(private readonly diseasesService: DiseasesService) { }

    // POST /diseases (Add disease record)
    @Post()
    create(@Body() createDiseaseDto: CreateDiseaseDto) {
        return this.diseasesService.create(createDiseaseDto);
    }

    // POST /diseases/symptom-check (Run Symptom Checker)
    @Post('symptom-check')
    checkSymptoms(@Body() symptomCheckDto: SymptomCheckDto) {
        return this.diseasesService.checkSymptoms(symptomCheckDto);
    }

    // GET /diseases?species=DOG (List all or filter by species)
    @Get()
    findAll(@Query('species') species?: PetSpecies) {
        return this.diseasesService.findAll(species);
    }

    // GET /diseases/:id (View single disease)
    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.diseasesService.findOne(id);
    }
}