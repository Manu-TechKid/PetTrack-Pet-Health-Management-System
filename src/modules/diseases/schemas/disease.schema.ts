import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { PetSpecies } from '../../../common/enums/species.enum';
import { RiskLevel } from '../../../common/enums/risk-level.enum';

export type DiseaseDocument = Disease & Document;

@Schema({ timestamps: true })
export class Disease {
  @Prop({ required: true, unique: true, trim: true })
  name: string;

  @Prop({ type: [String], enum: Object.values(PetSpecies), required: true })
  affectedSpecies: PetSpecies[];

  @Prop({ type: [String], required: true })
  symptoms: string[];

  @Prop({ required: true, trim: true })
  description: string;

  @Prop({ type: String, enum: Object.values(RiskLevel), default: RiskLevel.MEDIUM })
  riskLevel: RiskLevel;
}

export const DiseaseSchema = SchemaFactory.createForClass(Disease);
