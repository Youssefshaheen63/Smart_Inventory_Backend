import { Module } from '@nestjs/common';
import { SkuService } from './sku.service';
import { SkuController } from './sku.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sku } from './entities/sku.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Sku])],
  controllers: [SkuController],
  providers: [SkuService],
  exports: [SkuService]
})
export class SkuModule {}
