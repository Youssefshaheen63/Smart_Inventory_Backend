export class WarehouseResponseDto {
  id!: string;
  tenantId!: string;
  name!: string;
  address!: string | null;
  isMain!: boolean;
  isActive!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
}
