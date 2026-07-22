import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'node:crypto';
import { StockMovement } from './stock-movements/entities/stock-movement.entity';
import { StockLevel } from './stock-levels/entities/stock-level.entity';
import { RecordMovementDto } from './dto/record-movement.dto';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(StockMovement)
    private readonly movementRepo: Repository<StockMovement>,

    @InjectRepository(StockLevel)
    private readonly stockLevelRepo: Repository<StockLevel>,
  ) {}

  async recordMovement(
    skuId: string,
    dto: RecordMovementDto,
  ): Promise<StockMovement> {
    let stockLevel = await this.stockLevelRepo.findOne({
      where: { skuId, warehouseId: dto.warehouseId },
    });
    if (!stockLevel) {
      throw new NotFoundException(
        `Stock level not found for SKU "${skuId}" in warehouse "${dto.warehouseId}"`,
      );
    }

    const newBalance = stockLevel.quantity + dto.quantityChange;
    if (newBalance < 0) {
      throw new BadRequestException(
        `Movement would result in negative stock (current: ${stockLevel.quantity}, change: ${dto.quantityChange}).`,
      );
    }

    const movement = this.movementRepo.create({
      skuId,
      warehouseId: dto.warehouseId,
      reason: dto.reason,
      quantityChange: dto.quantityChange,
      balanceAfter: newBalance,
      idempotencyKey: randomUUID(),
      performedByUserId: dto.performedBy ?? null,
      note: dto.note ?? null,
    });
    const saved = await this.movementRepo.save(movement);

    stockLevel.quantity = newBalance;
    await this.stockLevelRepo.save(stockLevel);

    return saved;
  }

  async findLowStock(): Promise<StockLevel[]> {
    return this.stockLevelRepo
      .createQueryBuilder('sl')
      .where('sl."quantity" <= sl."reorderThreshold"')
      .orderBy('sl."quantity"', 'ASC')
      .getMany();
  }
}
