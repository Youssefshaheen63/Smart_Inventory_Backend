import { UserRole } from '../entities/user.entity';

export class UserResponseDto {
  id!: string;
  tenantId!: string;
  warehouseId!: string | null;
  email!: string;
  username!: string;
  firstName!: string | null;
  lastName!: string | null;
  role!: UserRole;
  isActive!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
}
