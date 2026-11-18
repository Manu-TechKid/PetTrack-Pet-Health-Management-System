import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../enums/role.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiredRoles || requiredRoles.length === 0) {
            return true; // No specific role required, allow access
        }

        const { user } = context.switchToHttp().getRequest();
        if (!user || !requiredRoles.includes(user.role)) {
            throw new ForbiddenException(
                `Access denied. Requires one of the following roles: ${requiredRoles.join(', ')}`,
            );
        }

        return true;
    }
}