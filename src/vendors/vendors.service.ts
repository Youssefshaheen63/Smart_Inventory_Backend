
import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vendor } from './entities/vendor.entity';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { VendorResponseDto } from './dto/vendor-response.dto';
import { VendorMapper } from './mappers/vendor.mapper';

@Injectable()
export class VendorsService {
  constructor(
    @InjectRepository(Vendor)
    private readonly vendorRepository: Repository<Vendor>,
    private readonly vendorMapper: VendorMapper,
  ) {}

  async create(dto: CreateVendorDto): Promise<VendorResponseDto> {
    const vendor = this.vendorMapper.toEntity(dto);
    const saved = await this.vendorRepository.save(vendor);
    return this.vendorMapper.toResponse(saved);
  }

  async findAll(): Promise<VendorResponseDto[]> {
    const vendors = await this.vendorRepository.find({
      order: { createdAt: 'DESC' },
    });
    return this.vendorMapper.toResponseList(vendors);
  }

  async findOne(id: string): Promise<VendorResponseDto> {
    const vendor = await this.vendorRepository.findOne({ where: { id } });
    if (!vendor) {
      throw new NotFoundException(`Vendor with ID "${id}" not found`);
    }
    return this.vendorMapper.toResponse(vendor);
  }

  async update(id: string, dto: UpdateVendorDto): Promise<VendorResponseDto> {
    const vendor = await this.vendorRepository.findOne({ where: { id } });
    if (!vendor) {
      throw new NotFoundException(`Vendor with ID "${id}" not found`);
    }

    const updated = this.vendorMapper.updateEntity(vendor, dto);
    const saved = await this.vendorRepository.save(updated);
    return this.vendorMapper.toResponse(saved);
  }

  async remove(id: string): Promise<void> {
    const vendor = await this.vendorRepository.findOne({ where: { id } });
    if (!vendor) {
      throw new NotFoundException(`Vendor with ID "${id}" not found`);
    }
    await this.vendorRepository.softRemove(vendor);
  }
}
