import { Transform } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateSkuDto {
 
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  @Transform(({ value }) => (value as string).trim().toUpperCase())
  @Matches(/^[A-Z0-9-_]+$/, {
    message: 'skuCode can only contain uppercase letters, digits, hyphens and underscores',
  })
  skuCode!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(255)
  @Transform(({ value }) => (value as string).trim())
  name!: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  @Transform(({ value }) => (value as string)?.trim() ?? null)
  description?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  @Transform(({ value }) => (value as string)?.trim() ?? null)
  category?: string;

 
  @IsString()
  @IsOptional()
  @MaxLength(50)
  @Transform(({ value }) => (value as string)?.trim().toLowerCase() ?? 'pcs')
  unit?: string;

  @IsNumber({ maxDecimalPlaces: 4 })
  @IsPositive()
  cost!: number;

  @IsNumber({ maxDecimalPlaces: 4 })
  @IsPositive()
  price!: number;

 
  @IsInt()
  @Min(0)
  @Max(1_000_000)
  @IsOptional()
  reorderThreshold?: number;

  @IsInt()
  @Min(0)
  @Max(1_000_000)
  @IsOptional()
  safetyStock?: number;
}
