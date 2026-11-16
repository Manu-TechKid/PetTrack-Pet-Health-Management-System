import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DiseasesController } from './diseases.controller';
import { DiseasesService } from './diseases.service';
import { Disease, DiseaseSchema } from './schemas/disease.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Disease.name, schema: DiseaseSchema },
        ]),
    ],
    controllers: [DiseasesController],
    providers: [DiseasesService],
    exports: [DiseasesService],
})
export class DiseasesModule { }