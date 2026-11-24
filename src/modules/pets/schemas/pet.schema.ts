import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { PetSpecies } from '../../../common/enums/species.enum';
import { PetGender } from '../../../common/enums/gender.enum';
import { User } from '../../users/schemas/user.schema';

export type PetDocument = Pet & Document;

@Schema({ timestamps: true })
export class Pet {
  @Prop({ required: true, trim: true })
  name: string;

  // Relational reference to User document (The Owner)
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: User.name, required: true })
  owner: MongooseSchema.Types.ObjectId;

  @Prop({ type: String, enum: Object.values(PetSpecies), required: true })
  species: PetSpecies;

  @Prop({ required: true, trim: true })
  breed: string;

  @Prop({ type: String, enum: Object.values(PetGender), required: true })
  gender: PetGender;

  @Prop({ required: true })
  dateOfBirth: Date;

  @Prop({ required: true, min: 0 })
  weightKg: number;

  @Prop({ type: [String], default: [] })
  allergies: string[];

  // Microchips are unique globally; sparse index allows pets without a microchip
  @Prop({ trim: true, unique: true, sparse: true, default: undefined })
  microchipId?: string;
}

export const PetSchema = SchemaFactory.createForClass(Pet);
PetSchema.index({ microchipId: 1 }, { unique: true, sparse: true });