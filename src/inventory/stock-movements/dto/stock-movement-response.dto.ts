import { MovementReason } from '../enums/movement-reason.enum';

export class StockMovementResponseDto {
  id!: string;

  skuId!: string;

  warehouseId!: string;

  reason!: MovementReason;

  quantityChange!: number;

  balanceAfter!: number;

  performedByUserId!: string | null;

  performedByAgent!: string | null;

  referenceType!: string | null;

  referenceId!: string | null;

  note!: string | null;

  createdAt!: Date;
}
