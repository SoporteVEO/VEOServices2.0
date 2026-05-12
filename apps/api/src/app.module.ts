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
import { TeamMembersModule } from './modules/team-members/team-members.module.js';
import { MeModule } from './modules/me/me.module.js';
import { AbsencesModule } from './modules/absences/absences.module.js';
import { NotificationsModule } from './modules/notifications/notifications.module.js';
import { UserMetricsModule } from './modules/user-metrics/user-metrics.module.js';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    BriloDatabaseModule,
    RedisModule,
    EmailModule,
    NotificationsModule,
    UsersModule,
    ContractsModule,
    PurchasesModule,
    DigitalBillboardsModule,
    BillboardsModule,
    ShopModule,
    PaypalModule,
    S3ImagesModule,
    StaticBillboardCodesModule,
    TeamMembersModule,
    MeModule,
    AbsencesModule,
    UserMetricsModule,
  ],
})
export class AppModule {}
