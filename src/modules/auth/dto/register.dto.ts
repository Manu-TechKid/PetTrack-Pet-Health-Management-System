import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { UserRole } from '../../../common/enums/role.enum';

export class RegisterDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsEmail({}, { message: 'Please enter a valid email address' })
    email: string;

    @IsString()
    @MinLength(6, { message: 'Password must be at least 6 characters long' })
    password: string;

    @IsEnum(UserRole, { message: 'Role must be OWNER, VET, or ADMIN' })
    @IsOptional()
    role?: UserRole;

    @IsString()
    @IsOptional()
    phone?: string;
}