import { Injectable } from '@nestjs/common';
import { User, UserRole } from '../entities/user.entity';
import { CreateUserDto } from '../dto/create-user.dto';
import { UserResponseDto } from '../dto/user-response.dto';

@Injectable()
export class UserMapper {
  toEntity(dto: CreateUserDto, tenantId: string): User {
    const user = new User();
    user.tenantId = tenantId;
    user.email = dto.email.toLowerCase().trim();
    user.username = dto.username.trim();
    user.password = dto.password; // raw — hashed by @BeforeInsert hook on entity
    user.firstName = dto.firstName?.trim() ?? null;
    user.lastName = dto.lastName?.trim() ?? null;
    user.role = dto.role ?? UserRole.INVENTORY_CLERK;
    user.warehouseId = dto.warehouseId ?? null;
    user.isActive = true;
    return user;
  }

  toResponse(entity: User): UserResponseDto {
    const dto = new UserResponseDto();
    dto.id = entity.id;
    dto.tenantId = entity.tenantId;
    dto.warehouseId = entity.warehouseId;
    dto.email = entity.email;
    dto.username = entity.username;
    dto.firstName = entity.firstName;
    dto.lastName = entity.lastName;
    dto.role = entity.role;
    dto.isActive = entity.isActive;
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    return dto;
  }

  toResponseList(entities: User[]): UserResponseDto[] {
    return entities.map((entity) => this.toResponse(entity));
  }
}
