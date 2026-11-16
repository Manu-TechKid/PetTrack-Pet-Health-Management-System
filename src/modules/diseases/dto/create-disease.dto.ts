import { IsArray, IsEnum, IsNotEmpty, IsString, ArrayNotEmpty } from 'class-validator';
import { PetSpecies } from '../../../common/enums/species.enum';
import { RiskLevel } from '../../../common/enums/risk-level.enum';

export class CreateDiseaseDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(PetSpecies, { each: true })
  affectedSpecies: PetSpecies[];

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  symptoms: string[];

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsEnum(RiskLevel)
  riskLevel: RiskLevel;
}
