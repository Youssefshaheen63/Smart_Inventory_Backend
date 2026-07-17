import { IsDateString, IsEnum, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../../utils/query.dto';
import { MovementReason } from '../enums/movement-reason.enum';

export class StockMovementQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @IsEnum(MovementReason)
  reason?: MovementReason;
}
