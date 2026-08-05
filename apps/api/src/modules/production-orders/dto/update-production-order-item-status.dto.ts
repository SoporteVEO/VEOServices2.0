import { ProductionOrderStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateProductionOrderItemStatusDto {
  @IsEnum(ProductionOrderStatus)
  status!: ProductionOrderStatus;
}
