import { Injectable, Logger } from '@nestjs/common';
import {
  ApiError,
  CheckoutPaymentIntent,
  Client,
  Environment,
  LogLevel,
  OrdersController,
} from '@paypal/paypal-server-sdk';

@Injectable()
export class PaypalService {
  private readonly logger = new Logger(PaypalService.name);
  private readonly client: Client;
  private readonly ordersController: OrdersController;

  constructor() {
    this.client = new Client({
      clientCredentialsAuthCredentials: {
        oAuthClientId: process.env.PAYPAL_API_KEY ?? '',
        oAuthClientSecret: process.env.PAYPAL_KEY ?? '',
      },
      timeout: 0,
      environment:
        process.env.NODE_ENV === 'production'
          ? Environment.Production
          : Environment.Sandbox,
      logging: { logLevel: LogLevel.Info },
    });
    this.ordersController = new OrdersController(this.client);
  }

  async createOrder(cart: Array<{ price: number; totalPrice?: number }>) {
    const total = cart.reduce(
      (sum, item) => sum + (item.totalPrice ?? item.price ?? 0),
      0,
    );
    const amount = total > 0 ? total.toFixed(2) : '0.01';

    try {
      const { body: rawBody, statusCode } =
        await this.ordersController.createOrder({
          body: {
            intent: CheckoutPaymentIntent.Capture,
            purchaseUnits: [{ amount: { currencyCode: 'USD', value: amount } }],
          },
          prefer: 'return=minimal',
        });

      const bodyString =
        typeof rawBody === 'string'
          ? rawBody
          : ((rawBody as any)?.toString?.() ?? '');
      return { data: JSON.parse(bodyString), statusCode };
    } catch (error) {
      if (error instanceof ApiError) {
        return { error: error.message, statusCode: error.statusCode ?? 500 };
      }
      throw error;
    }
  }

  async captureOrder(orderId: string) {
    try {
      const { body: rawBody, statusCode } =
        await this.ordersController.captureOrder({
          id: orderId,
          prefer: 'return=minimal',
        });

      const bodyString =
        typeof rawBody === 'string'
          ? rawBody
          : ((rawBody as any)?.toString?.() ?? '');
      return { data: JSON.parse(bodyString), statusCode };
    } catch (error) {
      if (error instanceof ApiError) {
        return { error: error.message, statusCode: error.statusCode ?? 500 };
      }
      throw error;
    }
  }
}
