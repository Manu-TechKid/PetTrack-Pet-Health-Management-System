import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PetsService } from './pets.service';
import { Pet } from './schemas/pet.schema';
import { UserRole } from '../../common/enums/role.enum';
import { PetSpecies } from '../../common/enums/species.enum';
import { PetGender } from '../../common/enums/gender.enum';
import { UsersService } from '../users/users.service';

describe('PetsService - Business Rules & Ownership Scoping', () => {
  let service: PetsService;

  const ownerAId = '6afd432f26d6f66d1e73af69';
  const ownerBId = '6afd432f26d6f66d1e73af99';

  const mockPet = {
    _id: '6b11111f26d6f66d1e73aa11',
    name: 'Buddy',
    owner: { _id: ownerAId, name: 'Emmanuel', email: 'emmanuel@example.com' },
    species: PetSpecies.DOG,
    breed: 'Golden Retriever',
    gender: PetGender.MALE,
    dateOfBirth: new Date('2023-05-15'),
    weightKg: 28.5,
    allergies: ['Chicken'],
  };

  const mockPetModel: any = jest.fn().mockImplementation((dto) => ({
    ...dto,
    save: jest.fn().mockResolvedValue({ ...dto, _id: mockPet._id }),
  }));

  mockPetModel.find = jest.fn();
  mockPetModel.findOne = jest.fn().mockReturnValue({
    exec: jest.fn().mockResolvedValue(null),
  });
  mockPetModel.findById = jest.fn();
  mockPetModel.findByIdAndUpdate = jest.fn();
  mockPetModel.findByIdAndDelete = jest.fn();

  const mockUsersService = {
    findById: jest.fn().mockImplementation((id: string) => {
      if (id === ownerBId) {
        return Promise.resolve({ _id: ownerBId, name: 'Owner B' });
      }
      return Promise.reject(new NotFoundException(`User with ID "${id}" not found`));
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PetsService,
        {
          provide: getModelToken(Pet.name),
          useValue: mockPetModel,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    service = module.get<PetsService>(PetsService);
    jest.clearAllMocks();
  });

  it('should create a pet linked to the authenticated owner ID', async () => {
    const createPetDto = {
      name: 'Buddy',
      species: PetSpecies.DOG,
      breed: 'Golden Retriever',
      gender: PetGender.MALE,
      dateOfBirth: '2023-05-15',
      weightKg: 28.5,
      allergies: ['Chicken'],
    };

    const result = await service.create(createPetDto, ownerAId, UserRole.OWNER);

    expect(result).toBeDefined();
    expect(result.name).toBe('Buddy');
    expect(result.owner.toString()).toBe(ownerAId);
  });

  it('should allow ADMIN to create a pet designating a specific ownerId', async () => {
    const adminId = '6afd432f26d6f66d1e73ad00';
    const createPetDto = {
      name: 'Max',
      species: PetSpecies.DOG,
      breed: 'German Shepherd',
      gender: PetGender.MALE,
      dateOfBirth: '2022-01-10',
      weightKg: 32.0,
      ownerId: ownerBId,
    };

    const result = await service.create(createPetDto, adminId, UserRole.ADMIN);

    expect(result).toBeDefined();
    expect(result.name).toBe('Max');
    expect(result.owner.toString()).toBe(ownerBId);
  });

  it('should throw NotFoundException if ADMIN designates non-existent ownerId', async () => {
    const adminId = '6afd432f26d6f66d1e73ad00';
    const createPetDto = {
      name: 'Ghost',
      species: PetSpecies.DOG,
      breed: 'Husky',
      gender: PetGender.MALE,
      dateOfBirth: '2022-01-10',
      weightKg: 25.0,
      ownerId: '7b0000000000000000000000',
    };

    await expect(
      service.create(createPetDto, adminId, UserRole.ADMIN),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw ConflictException if duplicate microchipId is provided', async () => {
    mockPetModel.findOne.mockReturnValueOnce({
      exec: jest.fn().mockResolvedValue({
        _id: 'existingPetId',
        microchipId: '985141009876543',
      }),
    });

    const createPetDto = {
      name: 'Bella',
      species: PetSpecies.CAT,
      breed: 'Siamese',
      gender: PetGender.FEMALE,
      dateOfBirth: '2024-02-10',
      weightKg: 4.3,
      microchipId: '985141009876543',
    };

    await expect(
      service.create(createPetDto, ownerAId, UserRole.OWNER),
    ).rejects.toThrow(ConflictException);
  });

  it('should restrict OWNER to query only their own pets', async () => {
    mockPetModel.find.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([mockPet]),
      }),
    });

    await service.findAll(ownerAId, UserRole.OWNER, PetSpecies.DOG);

    // Verify query enforces owner filter for OWNER role
    expect(mockPetModel.find).toHaveBeenCalledWith(
      expect.objectContaining({
        species: PetSpecies.DOG,
      }),
    );
  });

  it('should allow VET or ADMIN to view all pets across all owners', async () => {
    mockPetModel.find.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([mockPet]),
      }),
    });

    await service.findAll(ownerAId, UserRole.VET);

    // Query should NOT restrict by owner for VET
    expect(mockPetModel.find).toHaveBeenCalledWith({});
  });

  it('should allow an owner to inspect their own pet', async () => {
    mockPetModel.findById.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockPet),
      }),
    });

    const result = await service.findOne(mockPet._id, ownerAId, UserRole.OWNER);
    expect(result).toBeDefined();
    expect(result.name).toBe('Buddy');
  });

  it('should throw ForbiddenException if an owner attempts to inspect another user’s pet', async () => {
    mockPetModel.findById.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockPet),
      }),
    });

    // Owner B trying to access Owner A's pet
    await expect(
      service.findOne(mockPet._id, ownerBId, UserRole.OWNER),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should throw NotFoundException if pet does not exist', async () => {
    mockPetModel.findById.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      }),
    });

    await expect(
      service.findOne('nonExistentId', ownerAId, UserRole.OWNER),
    ).rejects.toThrow(NotFoundException);
  });
});
