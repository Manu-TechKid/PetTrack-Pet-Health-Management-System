import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
    constructor(
        @InjectModel(User.name)
        private readonly userModel: Model<UserDocument>,
    ) { }

    // Create a new user in MongoDB
    async create(userData: Partial<User>): Promise<UserDocument> {
        try {
            const newUser = new this.userModel(userData);
            return await newUser.save();
        } catch (error: any) {
            if (error.code === 11000) {
                throw new ConflictException(`User with email "${userData.email}" already exists`);
            }
            throw error;
        }
    }

    // Lookup user by email (used by AuthService during login)
    async findByEmail(email: string): Promise<UserDocument | null> {
        return this.userModel.findOne({ email: email.toLowerCase().trim() }).exec();
    }

    // Lookup user by ID (used by JWT strategy & profile, excludes passwordHash)
    async findById(id: string): Promise<UserDocument> {
        const user = await this.userModel.findById(id).select('-passwordHash').exec();
        if (!user) {
            throw new NotFoundException(`User with ID "${id}" not found`);
        }
        return user;
    }
}