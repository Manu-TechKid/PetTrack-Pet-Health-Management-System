import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PetsController } from './pets.controller';
import { PetsService } from './pets.service';
import { Pet, PetSchema } from './schemas/pet.schema';
import { UsersModule } from '../users/users.module';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Pet.name, schema: PetSchema }]),
        UsersModule,
    ],
    controllers: [PetsController],
    providers: [PetsService],
    exports: [PetsService], // Export PetsService so HealthCasesModule can use it in Phase 5!
})
export class PetsModule { }