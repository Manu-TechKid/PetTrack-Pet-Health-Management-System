import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Pet, PetDocument } from './schemas/pet.schema';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';
import { UserRole } from '../../common/enums/role.enum';
import { PetSpecies } from '../../common/enums/species.enum';
import { UsersService } from '../users/users.service';

@Injectable()
export class PetsService {
    constructor(
        @InjectModel(Pet.name)
        private readonly petModel: Model<PetDocument>,
        private readonly usersService: UsersService,
    ) { }

    // 1. Create a pet (linked to authenticated user, or designated owner if Admin)
    async create(
        createPetDto: CreatePetDto,
        userId: string,
        userRole: UserRole,
    ): Promise<Pet> {
        let assignedOwnerId = userId;

        // If Admin designates an ownerId, verify the owner exists first
        if (userRole === UserRole.ADMIN && createPetDto.ownerId) {
            await this.usersService.findById(createPetDto.ownerId);
            assignedOwnerId = createPetDto.ownerId;
        }

        // 1. Application-level check: prevent duplicate microchip IDs
        if (createPetDto.microchipId) {
            const existing = await this.petModel.findOne({
                microchipId: createPetDto.microchipId,
            }).exec();

            if (existing) {
                throw new ConflictException(
                    `Pet with microchip ID "${createPetDto.microchipId}" already exists`,
                );
            }
        }

        const { ownerId, ...petData } = createPetDto;
        const newPet = new this.petModel({
            ...petData,
            owner: new Types.ObjectId(assignedOwnerId),
        });

        try {
            return await newPet.save();
        } catch (error: any) {
            if (error.code === 11000) {
                throw new ConflictException(
                    `Pet with microchip ID "${createPetDto.microchipId}" already exists`,
                );
            }
            throw error;
        }
    }

    // 2. Find pets (Scoped by user role)
    async findAll(
        userId: string,
        userRole: UserRole,
        species?: PetSpecies,
    ): Promise<Pet[]> {
        const query: any = {};

        // Business Rule: OWNERS can only see their own pets. VET and ADMIN see all pets.
        if (userRole === UserRole.OWNER) {
            query.owner = new Types.ObjectId(userId);
        }

        if (species) {
            query.species = species;
        }

        return this.petModel
            .find(query)
            .populate('owner', 'name email phone')
            .exec();
    }

    // 3. Find a single pet by ID (with ownership check)
    async findOne(id: string, userId: string, userRole: UserRole): Promise<Pet> {
        const pet = await this.petModel
            .findById(id)
            .populate('owner', 'name email phone')
            .exec();

        if (!pet) {
            throw new NotFoundException(`Pet with ID "${id}" not found`);
        }

        // Business Rule: OWNERS cannot inspect pets belonging to other owners
        if (userRole === UserRole.OWNER && (pet.owner as any)._id.toString() !== userId) {
            throw new ForbiddenException('Access denied. You do not own this pet.');
        }

        return pet;
    }

    // 4. Update pet (with ownership check)
    async update(
        id: string,
        updatePetDto: UpdatePetDto,
        userId: string,
        userRole: UserRole,
    ): Promise<Pet> {
        // Verify ownership first
        await this.findOne(id, userId, userRole);

        // Prevent duplicate microchip IDs on update
        if (updatePetDto.microchipId) {
            const existing = await this.petModel.findOne({
                microchipId: updatePetDto.microchipId,
                _id: { $ne: id },
            }).exec();

            if (existing) {
                throw new ConflictException(
                    `Pet with microchip ID "${updatePetDto.microchipId}" already exists`,
                );
            }
        }

        try {
            const updatedPet = await this.petModel
                .findByIdAndUpdate(id, updatePetDto, { new: true })
                .populate('owner', 'name email phone')
                .exec();

            return updatedPet!;
        } catch (error: any) {
            if (error.code === 11000) {
                throw new ConflictException(
                    `Pet with microchip ID "${updatePetDto.microchipId}" already exists`,
                );
            }
            throw error;
        }
    }

    // 5. Delete pet (with ownership check)
    async remove(id: string, userId: string, userRole: UserRole): Promise<{ message: string }> {
        await this.findOne(id, userId, userRole);
        await this.petModel.findByIdAndDelete(id).exec();
        return { message: `Pet with ID "${id}" successfully removed` };
    }
}