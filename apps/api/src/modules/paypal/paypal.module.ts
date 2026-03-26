import { Module } from '@nestjs/common';
import { PaypalService } from './paypal.service.js';
import { PaypalController } from './paypal.controller.js';

@Module({
  controllers: [PaypalController],
  providers: [PaypalService],
})
export class PaypalModule {}
