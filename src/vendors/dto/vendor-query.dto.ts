import { IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../utils/query.dto';

export class VendorQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  sortBy?: string = 'name';

  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'ASC';
}
