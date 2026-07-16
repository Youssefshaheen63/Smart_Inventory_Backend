
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { VendorsService } from './vendors.service';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { VendorResponseDto } from './dto/vendor-response.dto';

@ApiTags('vendors')
@Controller('vendors')
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a vendor' })
  @ApiCreatedResponse({ type: VendorResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid request body' })
  create(@Body() dto: CreateVendorDto): Promise<VendorResponseDto> {
    return this.vendorsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List vendors' })
  @ApiOkResponse({ type: VendorResponseDto, isArray: true })
  findAll(): Promise<VendorResponseDto[]> {
    return this.vendorsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a vendor by ID' })
  @ApiParam({ name: 'id', description: 'Vendor UUID' })
  @ApiOkResponse({ type: VendorResponseDto })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<VendorResponseDto> {
    return this.vendorsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a vendor' })
  @ApiParam({ name: 'id', description: 'Vendor UUID' })
  @ApiOkResponse({ type: VendorResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid request body' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateVendorDto,
  ): Promise<VendorResponseDto> {
    return this.vendorsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a vendor' })
  @ApiParam({ name: 'id', description: 'Vendor UUID' })
  @ApiNoContentResponse({ description: 'Vendor deleted successfully' })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.vendorsService.remove(id);
  }
}
