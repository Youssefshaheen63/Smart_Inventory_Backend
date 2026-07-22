export class CategoryResponseDto {
  id!: string;
  tenantId!: string;
  name!: string;
  description!: string | null;
  createdAt!: Date;
  updatedAt!: Date;
}
