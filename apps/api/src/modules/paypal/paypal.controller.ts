import { Controller, Post, Body, Param, HttpException } from '@nestjs/common';
import { PaypalService } from './paypal.service.js';

@Controller('paypal')
export class PaypalController {
  constructor(private readonly paypalService: PaypalService) {}

  @Post('orders')
  async createOrder(@Body() body: { cart: Array<{ price: number }> }) {
    const result = await this.paypalService.createOrder(body.cart);
    if (result.error) {
      throw new HttpException(
        { error: result.error },
        result.statusCode ?? 500,
      );
    }
    return result.data;
  }

  @Post('orders/:orderId/capture')
  async captureOrder(@Param('orderId') orderId: string) {
    const result = await this.paypalService.captureOrder(orderId);
    if (result.error) {
      throw new HttpException(
        { error: result.error },
        result.statusCode ?? 500,
      );
    }
    return result.data;
  }
}
