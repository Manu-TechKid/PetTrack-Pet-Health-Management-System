import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { PetSpecies } from '../../../common/enums/species.enum';
import { PetGender } from '../../../common/enums/gender.enum';

export class CreatePetDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(PetSpecies, { message: 'Species must be DOG, CAT, BIRD, or OTHER' })
  @IsNotEmpty()
  species: PetSpecies;

  @IsString()
  @IsNotEmpty()
  breed: string;

  @IsEnum(PetGender, { message: 'Gender must be MALE or FEMALE' })
  @IsNotEmpty()
  gender: PetGender;

  @IsDateString({}, { message: 'dateOfBirth must be a valid ISO date string (YYYY-MM-DD)' })
  @IsNotEmpty()
  dateOfBirth: string;

  @IsNumber()
  @IsPositive({ message: 'weightKg must be a positive number' })
  weightKg: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  allergies?: string[];

  @IsString()
  @IsOptional()
  microchipId?: string;

  @IsString()
  @IsOptional()
  ownerId?: string;
}