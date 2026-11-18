import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { UserRole } from '../../common/enums/role.enum';

// Mock bcrypt module so Jest doesn't attempt to spy on native CJS binary properties
jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('AuthService - Business Rules', () => {
  let authService: AuthService;
  let usersService: Partial<UsersService>;
  let jwtService: Partial<JwtService>;

  const mockUser = {
    _id: '6afd432f26d6f66d1e73af69',
    name: 'Emmanuel Kiprotich',
    email: 'techkid250@gmail.com',
    passwordHash: '$2b$10$fakeHashedPasswordValueHere',
    role: UserRole.OWNER,
    phone: '+254726991317',
    createdAt: new Date(),
  };

  beforeEach(async () => {
    usersService = {
      create: jest.fn().mockResolvedValue(mockUser),
      findByEmail: jest.fn().mockImplementation((email: string) => {
        if (email === mockUser.email) return Promise.resolve(mockUser);
        return Promise.resolve(null);
      }),
    };

    jwtService = {
      sign: jest.fn().mockReturnValue('mocked.jwt.access.token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  it('should register a new user and hash the password with bcrypt', async () => {
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword123');

    const result = await authService.register({
      name: 'Emmanuel Kiprotich',
      email: 'techkid250@gmail.com',
      password: 'password1234',
      role: UserRole.OWNER,
    });

    expect(bcrypt.hash).toHaveBeenCalledWith('password1234', 10);
    expect(result).toBeDefined();
    expect(result.email).toBe('techkid250@gmail.com');
    expect((result as any).passwordHash).toBeUndefined(); // Never expose passwordHash
  });

  it('should authenticate user and return an accessToken when credentials are valid', async () => {
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    const result = await authService.login({
      email: 'techkid250@gmail.com',
      password: 'password1234',
    });

    expect(result.accessToken).toBe('mocked.jwt.access.token');
    expect(result.user.email).toBe('techkid250@gmail.com');
    expect(result.user.role).toBe(UserRole.OWNER);
  });

  it('should throw UnauthorizedException when password does not match', async () => {
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(
      authService.login({
        email: 'techkid250@gmail.com',
        password: 'wrongPassword',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException when email is not registered', async () => {
    await expect(
      authService.login({
        email: 'nonexistent@example.com',
        password: 'anyPassword',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
