import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Disease, DiseaseDocument } from './schemas/disease.schema';
import { CreateDiseaseDto } from './dto/create-disease.dto';
import { SymptomCheckDto } from './dto/symptom-check.dto';
import { RiskLevel } from '../../common/enums/risk-level.enum';
import { PetSpecies } from '../../common/enums/species.enum';

export interface SymptomMatchResult {
  disease: string;
  matchedSymptoms: string[];
  matchConfidence: number;
  riskLevel: RiskLevel;
  triageGuidance: string;
}

@Injectable()
export class DiseasesService {
  constructor(
    @InjectModel(Disease.name)
    private readonly diseaseModel: Model<DiseaseDocument>,
  ) {}

  // 1. Create a new disease record
  async create(createDiseaseDto: CreateDiseaseDto): Promise<Disease> {
    try {
      // Normalize symptoms to lowercase for clean matching later
      const normalizedDto = {
        ...createDiseaseDto,
        symptoms: createDiseaseDto.symptoms.map((s: string) => s.trim().toLowerCase()),
      };
      const createdDisease = new this.diseaseModel(normalizedDto);
      return await createdDisease.save();
    } catch (error: any) {
      if (error.code === 11000) {
        throw new ConflictException(`Disease with name "${createDiseaseDto.name}" already exists`);
      }
      throw error;
    }
  }

  // 2. View all diseases (with optional species filter)
  async findAll(species?: PetSpecies): Promise<Disease[]> {
    const filter = species ? { affectedSpecies: species } : {};
    return this.diseaseModel.find(filter).exec();
  }

  // 3. View a single disease by ID
  async findOne(id: string): Promise<Disease> {
    const disease = await this.diseaseModel.findById(id).exec();
    if (!disease) {
      throw new NotFoundException(`Disease with ID "${id}" not found`);
    }
    return disease;
  }

  // 4. The Core Symptom Checker Algorithm
  async checkSymptoms(dto: SymptomCheckDto): Promise<{ species: PetSpecies; matches: SymptomMatchResult[] }> {
    // Step i: Retrieve candidates matching the requested species (case-insensitive)
    const candidates = await this.diseaseModel
      .find({
        affectedSpecies: { $regex: new RegExp(`^${dto.species}$`, 'i') },
      })
      .exec();

    // Normalize observed symptoms to lowercase for accurate comparison
    const observedNormalized = dto.symptoms.map((s: string) => s.trim().toLowerCase());

    const matches: SymptomMatchResult[] = [];

    // Step ii: Array intersection & score calculation for each candidate
    for (const disease of candidates) {
      const diseaseSymptomsNormalized = disease.symptoms.map((s: string) => s.trim().toLowerCase());

      // Intersection: symptoms observed that exist in documented disease symptoms
      const matched = diseaseSymptomsNormalized.filter((s: string) =>
        observedNormalized.includes(s),
      );

      // Only consider if there's at least 1 matching symptom
      if (matched.length > 0) {
        // Step iii: Score = (matched / total documented) * 100
        const rawScore = (matched.length / disease.symptoms.length) * 100;
        const matchConfidence = Number(rawScore.toFixed(2)); // Rounded to 2 decimals

        // Step iv: Clinical triage guidance
        const triageGuidance =
          disease.riskLevel === RiskLevel.HIGH
            ? 'Arrange a veterinary examination promptly.'
            : 'Monitor your pet and consult a veterinarian if symptoms persist or worsen.';

        matches.push({
          disease: disease.name,
          matchedSymptoms: matched,
          matchConfidence,
          riskLevel: disease.riskLevel,
          triageGuidance,
        });
      }
    }

    // Step v: Sort descending by match confidence (highest score first)
    matches.sort((a, b) => b.matchConfidence - a.matchConfidence);

    return {
      species: dto.species,
      matches,
    };
  }
}
