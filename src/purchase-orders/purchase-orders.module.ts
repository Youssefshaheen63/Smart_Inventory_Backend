import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PurchaseOrdersService } from './purchase-orders.service';
import { PurchaseOrdersController } from './purchase-orders.controller';
import { PurchaseOrderMapper } from './mappers/purchase-order.mapper';
import { PurchaseOrder } from './entities/purchase-order.entity';
import { PurchaseOrderLineItem } from './entities/purchase-order-line-item.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PurchaseOrder, PurchaseOrderLineItem])],
  controllers: [PurchaseOrdersController],
  providers: [PurchaseOrdersService, PurchaseOrderMapper],
  exports: [PurchaseOrdersService],
})
export class PurchaseOrdersModule {}
