import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'node:crypto';
import { Sku } from '../sku/entities/sku.entity';
import { StockMovement } from './stock-movements/entities/stock-movement.entity';
import { RecordMovementDto } from './dto/record-movement.dto';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(StockMovement)
    private readonly movementRepo: Repository<StockMovement>,

    @InjectRepository(Sku)
    private readonly skuRepo: Repository<Sku>,
  ) {}

  async recordMovement(
    skuId: string,
    dto: RecordMovementDto,
  ): Promise<StockMovement> {
    const sku = await this.skuRepo.findOne({ where: { id: skuId } });
    if (!sku) {
      throw new NotFoundException(`SKU with ID "${skuId}" not found`);
    }

    const newBalance = sku.currentQuantity + dto.quantityChange;
    if (newBalance < 0) {
      throw new BadRequestException(
        `Movement would result in negative stock (current: ${sku.currentQuantity}, change: ${dto.quantityChange}).`,
      );
    }

    const movement = this.movementRepo.create({
      skuId,
      reason: dto.reason,
      quantityChange: dto.quantityChange,
      balanceAfter: newBalance,
      idempotencyKey: randomUUID(),
      performedByUserId: dto.performedBy ?? null,
      note: dto.note ?? null,
    });
    const saved = await this.movementRepo.save(movement);

    await this.skuRepo.increment({ id: skuId }, 'currentQuantity', dto.quantityChange);

    return saved;
  }
}
