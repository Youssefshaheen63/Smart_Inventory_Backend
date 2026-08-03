import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { validate, ValidationError } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { parse } from 'csv-parse/sync';
import { Sku } from './entities/sku.entity';
import { CreateSkuDto } from './dto/create-sku.dto';
import { UpdateSkuDto } from './dto/update-sku.dto';
import { SkuResponseDto } from './dto/sku-response.dto';
import { SkuMapper } from './mappers/sku.mapper';
import { SkuQueryDto } from './dto/sku-query.dto';
import { CsvImportErrorDto, CsvImportResponseDto } from './dto/csv-import-response.dto';
import { paginate } from '../utils/pagination.util';
import { applySortAndSearch } from '../utils/query.util';

@Injectable()
export class SkuService {
  constructor(
    @InjectRepository(Sku)
    private readonly skuRepository: Repository<Sku>,
    private readonly skuMapper: SkuMapper,
  ) {}

  async create(createSkuDto: CreateSkuDto): Promise<SkuResponseDto> {
    const existing = await this.skuRepository.findOne({
      where: { skuCode: createSkuDto.skuCode },
    });
    if (existing) {
      throw new ConflictException(
        `SKU code "${createSkuDto.skuCode}" already exists`,
      );
    }
    const skuEntity = this.skuMapper.toEntity(createSkuDto);
    const savedEntity = await this.skuRepository.save(skuEntity);
    return this.skuMapper.toResponse(savedEntity);
  }

  async importCsv(buffer: Buffer): Promise<CsvImportResponseDto> {
    if (!buffer || buffer.length === 0) {
      throw new BadRequestException('Uploaded CSV file is empty');
    }

    let records: Record<string, any>[];
    try {
      records = parse(buffer, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        bom: true,
        relax_column_count: true,
      });
    } catch (err: any) {
      throw new BadRequestException(`Malformed CSV file: ${err.message || err}`);
    }

    if (!records || records.length === 0) {
      throw new BadRequestException('CSV file contains no data rows');
    }

    const errors: CsvImportErrorDto[] = [];
    const validDtosToSave: { rowNum: number; dto: CreateSkuDto }[] = [];
    const seenSkuCodesInCsv = new Set<string>();

    // Pass 1: DTO Validation & CSV In-Memory Duplicate Check
    for (let i = 0; i < records.length; i++) {
      const rowNum = i + 1;
      const rawRow = records[i];

      const plainDtoObj = this.mapCsvRowToPlainDto(rawRow);
      const dtoInstance = plainToInstance(CreateSkuDto, plainDtoObj);

      const validationErrors = await validate(dtoInstance, { whitelist: true });
      if (validationErrors.length > 0) {
        errors.push({
          row: rowNum,
          skuCode: dtoInstance.skuCode || this.extractSkuCodeFromRaw(rawRow),
          message: this.formatValidationErrors(validationErrors),
        });
        continue;
      }

      // Check for duplicate SKU code inside the CSV itself
      const normalizedSkuCode = dtoInstance.skuCode;
      if (seenSkuCodesInCsv.has(normalizedSkuCode)) {
        errors.push({
          row: rowNum,
          skuCode: normalizedSkuCode,
          message: `Duplicate SKU code "${normalizedSkuCode}" found in CSV file`,
        });
        continue;
      }

      seenSkuCodesInCsv.add(normalizedSkuCode);
      validDtosToSave.push({ rowNum, dto: dtoInstance });
    }

    // Pass 2: DB Uniqueness Verification & Transactional Batch Insertion
    let successfulCount = 0;

    if (validDtosToSave.length > 0) {
      const candidateCodes = validDtosToSave.map((item) => item.dto.skuCode);
      const existingSkuCodesSet = await this.findExistingSkuCodes(candidateCodes);

      const dtosToInsert: CreateSkuDto[] = [];

      for (const item of validDtosToSave) {
        if (existingSkuCodesSet.has(item.dto.skuCode)) {
          errors.push({
            row: item.rowNum,
            skuCode: item.dto.skuCode,
            message: `SKU code "${item.dto.skuCode}" already exists`,
          });
        } else {
          dtosToInsert.push(item.dto);
        }
      }

      if (dtosToInsert.length > 0) {
        successfulCount = await this.batchInsertSkus(dtosToInsert);
      }
    }

    errors.sort((a, b) => a.row - b.row);

    return {
      totalRows: records.length,
      successful: successfulCount,
      failed: errors.length,
      errors,
    };
  }

  private mapCsvRowToPlainDto(rawRow: Record<string, any>): Record<string, any> {
    const plain: Record<string, any> = {};

    for (const [key, rawValue] of Object.entries(rawRow)) {
      if (!key) continue;
      const normalizedKey = key.trim().toLowerCase().replace(/[\s_-]+/g, '');
      const strVal = typeof rawValue === 'string' ? rawValue.trim() : rawValue;

      if (normalizedKey === 'skucode') {
        plain.skuCode = strVal;
      } else if (normalizedKey === 'name') {
        plain.name = strVal;
      } else if (normalizedKey === 'description') {
        plain.description = strVal === '' ? null : strVal;
      } else if (normalizedKey === 'category') {
        plain.category = strVal === '' ? null : strVal;
      } else if (normalizedKey === 'unit') {
        plain.unit = strVal === '' ? undefined : strVal;
      } else if (normalizedKey === 'costprice' || normalizedKey === 'cost') {
        plain.cost = this.parseNumericValue(strVal);
      } else if (normalizedKey === 'sellingprice' || normalizedKey === 'price') {
        plain.price = this.parseNumericValue(strVal);
      } else if (normalizedKey === 'reorderthreshold') {
        plain.reorderThreshold = this.parseNumericValue(strVal);
      } else if (normalizedKey === 'safetystock') {
        plain.safetyStock = this.parseNumericValue(strVal);
      }
    }

    return plain;
  }

  private extractSkuCodeFromRaw(rawRow: Record<string, any>): string | null {
    for (const [key, value] of Object.entries(rawRow)) {
      if (key && key.trim().toLowerCase().replace(/[\s_-]+/g, '') === 'skucode') {
        return typeof value === 'string' && value.trim() ? value.trim() : null;
      }
    }
    return null;
  }

  private parseNumericValue(val: any): any {
    if (val === '' || val === null || val === undefined) {
      return undefined;
    }
    const num = Number(val);
    return isNaN(num) ? val : num;
  }

  private formatValidationErrors(errors: ValidationError[]): string {
    const messages: string[] = [];

    const extractMessages = (errList: ValidationError[]) => {
      for (const err of errList) {
        if (err.constraints) {
          messages.push(...Object.values(err.constraints));
        }
        if (err.children && err.children.length > 0) {
          extractMessages(err.children);
        }
      }
    };

    extractMessages(errors);
    return messages.join('; ');
  }

  private async findExistingSkuCodes(skuCodes: string[]): Promise<Set<string>> {
    const existingSet = new Set<string>();
    const chunkSize = 1000;

    for (let i = 0; i < skuCodes.length; i += chunkSize) {
      const chunk = skuCodes.slice(i, i + chunkSize);
      const existing = await this.skuRepository.find({
        where: { skuCode: In(chunk) },
        select: ['skuCode'],
      });
      existing.forEach((item) => existingSet.add(item.skuCode));
    }

    return existingSet;
  }

  private async batchInsertSkus(dtos: CreateSkuDto[]): Promise<number> {
    const entities = dtos.map((dto) => this.skuMapper.toEntity(dto));
    const chunkSize = 500;
    let savedCount = 0;

    await this.skuRepository.manager.transaction(async (transactionalEntityManager) => {
      for (let i = 0; i < entities.length; i += chunkSize) {
        const chunk = entities.slice(i, i + chunkSize);
        await transactionalEntityManager.save(Sku, chunk);
        savedCount += chunk.length;
      }
    });

    return savedCount;
  }

  async findAll(query: SkuQueryDto): Promise<{ data: SkuResponseDto[]; total: number }> {
    const qb = this.skuRepository.createQueryBuilder('sku');
    applySortAndSearch(qb, 'sku', query.sortBy, query.sortOrder, query.search, ['name', 'skuCode']);
    const result = await paginate(qb, query.page!, query.limit!);
    return { data: this.skuMapper.toResponseList(result.data), total: result.total };
  }

  async findOne(id: string): Promise<SkuResponseDto> {
    const skuEntity = await this.skuRepository.findOne({ where: { id } });
    if (!skuEntity) {
      throw new NotFoundException(`SKU with ID "${id}" not found`);
    }
    return this.skuMapper.toResponse(skuEntity);
  }

  async update(id: string, updateSkuDto: UpdateSkuDto): Promise<SkuResponseDto> {
    const skuEntity = await this.skuRepository.findOne({ where: { id } });
    if (!skuEntity) {
      throw new NotFoundException(`SKU with ID "${id}" not found`);
    }

    if (updateSkuDto.skuCode && updateSkuDto.skuCode !== skuEntity.skuCode) {
      const existing = await this.skuRepository.findOne({
        where: { skuCode: updateSkuDto.skuCode },
      });
      if (existing) {
        throw new ConflictException(
          `SKU code "${updateSkuDto.skuCode}" already exists`,
        );
      }
    }

    const updatedEntity = this.skuMapper.updateEntity(skuEntity, updateSkuDto);
    const savedEntity = await this.skuRepository.save(updatedEntity);
    return this.skuMapper.toResponse(savedEntity);
  }

  async remove(id: string): Promise<void> {
    const skuEntity = await this.skuRepository.findOne({ where: { id } });
    if (!skuEntity) {
      throw new NotFoundException(`SKU with ID "${id}" not found`);
    }
    await this.skuRepository.softRemove(skuEntity);
  }
}
