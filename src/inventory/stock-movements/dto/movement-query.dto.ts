import { IsDateString, IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { MovementReason } from '../enums/movement-reason.enum';

export class MovementQueryDto {
  /** ISO-8601 date string — return movements at or after this timestamp. */
  @IsOptional()
  @IsDateString()
  from?: string;

  /** ISO-8601 date string — return movements at or before this timestamp. */
  @IsOptional()
  @IsDateString()
  to?: string;

  /** Filter by a specific movement reason. */
  @IsOptional()
  @IsEnum(MovementReason)
  reason?: MovementReason;

  /**
   * Maximum number of rows to return (newest first).
   * Defaults to 50.  Hard-capped at 500 to avoid accidental full-scans.
   */
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(500)
  limit?: number = 50;
}
