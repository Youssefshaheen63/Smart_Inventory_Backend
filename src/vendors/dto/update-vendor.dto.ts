import { PartialType } from '@nestjs/mapped-types';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateVendorDto } from './create-vendor.dto';

export class UpdateVendorDto extends PartialType(CreateVendorDto) {
  @ApiPropertyOptional({ example: 'Acme Supplies' })
  name?: string;

  @ApiPropertyOptional({ example: 'sales@acme.com' })
  contactEmail?: string;

  @ApiPropertyOptional({ example: '+20 100 000 0000' })
  contactPhone?: string;
}
