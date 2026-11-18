import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UserRole } from '../../common/enums/role.enum';

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
    ) { }

    // 1. Register a new user
    async register(registerDto: RegisterDto) {
        const { password, ...rest } = registerDto;

        // Hash the plain-text password with a salt round of 10
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        const createdUser = await this.usersService.create({
            ...rest,
            passwordHash,
            role: registerDto.role || UserRole.OWNER,
        });

        // Return the created user without the password hash
        return {
            id: createdUser._id,
            name: createdUser.name,
            email: createdUser.email,
            role: createdUser.role,
            phone: createdUser.phone,
            createdAt: (createdUser as any).createdAt,
        };
    }

    // 2. Authenticate user and issue JWT token
    async login(loginDto: LoginDto) {
        const { email, password } = loginDto;

        // Find user by email
        const user = await this.usersService.findByEmail(email);
        if (!user) {
            throw new UnauthorizedException('Invalid email or password');
        }

        // Compare submitted password with stored bcrypt hash
        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid email or password');
        }

        // Construct JWT Payload
        const payload = {
            sub: user._id.toString(),
            email: user.email,
            role: user.role,
        };

        const accessToken = this.jwtService.sign(payload);

        return {
            accessToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        };
    }
}