import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { MovementReason } from '../stock-movements/enums/movement-reason.enum';

export class RecordMovementDto {
  @IsInt()
  @Min(-1_000_000)
  quantityChange!: number;

  @IsEnum(MovementReason)
  reason!: MovementReason;

  @IsString()
  @MaxLength(100)
  @IsOptional()
  performedBy?: string;

  @IsString()
  @MaxLength(2000)
  @IsOptional()
  note?: string;
}
