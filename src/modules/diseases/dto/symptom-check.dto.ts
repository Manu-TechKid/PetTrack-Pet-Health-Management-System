import { IsArray, IsEnum, IsNotEmpty, IsString, ArrayNotEmpty } from 'class-validator';
import { PetSpecies } from '../../../common/enums/species.enum';

export class SymptomCheckDto {
  @IsEnum(PetSpecies)
  @IsNotEmpty()
  species: PetSpecies;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  symptoms: string[];
}
