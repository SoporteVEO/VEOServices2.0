import { Module } from '@nestjs/common';
import { PrismaModule } from './modules/prisma/prisma.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { BriloDatabaseModule } from './modules/brilo-database/brilo-database.module.js';
import { RedisModule } from './modules/redis/redis.module.js';
import { EmailModule } from './modules/email/email.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { ContractsModule } from './modules/contracts/contracts.module.js';
import { PurchasesModule } from './modules/purchases/purchases.module.js';
import { DigitalBillboardsModule } from './modules/digital-billboards/digital-billboards.module.js';
import { BillboardsModule } from './modules/billboards/billboards.module.js';
import { ShopModule } from './modules/shop/shop.module.js';
import { PaypalModule } from './modules/paypal/paypal.module.js';
import { S3ImagesModule } from './modules/s3-images/s3-images.module.js';
import { StaticBillboardCodesModule } from './modules/static-billboard-codes/static-billboard-codes.module.js';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    BriloDatabaseModule,
    RedisModule,
    EmailModule,
    UsersModule,
    ContractsModule,
    PurchasesModule,
    DigitalBillboardsModule,
    BillboardsModule,
    ShopModule,
    PaypalModule,
    S3ImagesModule,
    StaticBillboardCodesModule,
  ],
})
export class AppModule {}
