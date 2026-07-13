
export class SkuResponseDto {
  id!: string;

  skuCode!: string;

  name!: string;

  description!: string | null;

  category!: string | null;

  unit!: string;

  cost!: number;

  price!: number;

  reorderThreshold!: number;

  safetyStock!: number;

  createdAt!: Date;

  updatedAt!: Date;
}
