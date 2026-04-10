import { Controller, Post, Body, Param, HttpException } from '@nestjs/common';
import { PaypalService } from './paypal.service.js';
import { Public } from '../auth/decorators.js';

@Public()
@Controller('paypal')
export class PaypalController {
  constructor(private readonly paypalService: PaypalService) {}

  @Post('orders')
  async createOrder(
    @Body() body: { cart: Array<{ price: number; totalPrice?: number }> },
  ): Promise<unknown> {
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
  async captureOrder(@Param('orderId') orderId: string): Promise<unknown> {
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
