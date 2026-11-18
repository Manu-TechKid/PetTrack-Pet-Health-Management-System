import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { UserRole } from '../../../common/enums/role.enum';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
    @Prop({ required: true, trim: true })
    name: string;

    @Prop({ required: true, unique: true, lowercase: true, trim: true })
    email: string;

    @Prop({ required: true })
    passwordHash: string;

    @Prop({ type: String, enum: Object.values(UserRole), default: UserRole.OWNER })
    role: UserRole;

    @Prop({ trim: true })
    phone: string;
}

export const UserSchema = SchemaFactory.createForClass(User);