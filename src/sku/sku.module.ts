import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SkuService } from './sku.service';
import { SkuController } from './sku.controller';
import { Sku } from './entities/sku.entity';
import { SkuMapper } from './mappers/sku.mapper';

/**
 * Module wrapping SKU domain logic, containing controller, service, mapper, and entity definitions.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Sku])],
  controllers: [SkuController],
  providers: [SkuService, SkuMapper],
  exports: [SkuService, SkuMapper],
})
export class SkuModule {}
