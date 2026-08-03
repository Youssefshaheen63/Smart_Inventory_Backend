
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
import { VendorQueryDto } from './dto/vendor-query.dto';
import { paginate } from '../utils/pagination.util';
import { applySortAndSearch } from '../utils/query.util';

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

  async findAll(query: VendorQueryDto): Promise<{ data: VendorResponseDto[]; total: number }> {
    const qb = this.vendorRepository.createQueryBuilder('vendor');
    applySortAndSearch(qb, 'vendor', query.sortBy, query.sortOrder, query.search, ['name', 'contactEmail']);
    const result = await paginate(qb, query.page!, query.limit!);
    return { data: this.vendorMapper.toResponseList(result.data), total: result.total };
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
