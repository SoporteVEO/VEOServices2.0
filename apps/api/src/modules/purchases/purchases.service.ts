import {
  Injectable,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { ShopService } from '../shop/shop.service.js';
import { isDigitalSpotOption } from '../shop/digital-spots.js';

interface IncomingStatic {
  kind?: 'static';
  billboardId: number;
  billboardCode: string | null;
  reference: string | null;
  departmentName: string | null;
  cityName: string | null;
  address: string | null;
  price: number;
  from: string;
  to: string;
}

interface IncomingDigital {
  kind: 'digital';
  digitalBillboardId: string;
  spotCount: number;
  billboardCode: string | null;
  reference: string | null;
  departmentName: string | null;
  cityName: string | null;
  address: string | null;
  price: number;
  from: string;
  to: string;
}

type IncomingItem = IncomingStatic | IncomingDigital;

function isDigitalItem(item: IncomingItem): item is IncomingDigital {
  return item.kind === 'digital';
}

@Injectable()
export class PurchasesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly shopService: ShopService,
  ) {}

  async findAll() {
    const purchases = await this.prisma.purchase.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        customer: true,
        items: true,
      },
    });

    return purchases.map((p) => ({
      id: p.id,
      createdAt: p.createdAt.toISOString(),
      status: p.status,
      paypalOrderId: p.paypalOrderId,
      customerEmail: p.customer.email,
      customerName: p.customer.name,
      items: p.items.map((i) => ({
        id: i.id,
        billboardId: i.billboardId,
        digitalBillboardId: i.digitalBillboardId,
        spotCount: i.spotCount,
        billboardCode: i.billboardCode,
        reference: i.reference,
        departmentName: i.departmentName,
        cityName: i.cityName,
        address: i.address,
        price: i.price,
        from: i.from.toISOString(),
        to: i.to.toISOString(),
      })),
    }));
  }

  async findOne(id: string) {
    const purchase = await this.prisma.purchase.findUnique({
      where: { id },
      include: {
        items: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!purchase) return null;

    return {
      id: purchase.id,
      status: purchase.status,
      paypalOrderId: purchase.paypalOrderId,
      createdAt: purchase.createdAt,
      items: purchase.items.map((item) => ({
        id: item.id,
        billboardId: item.billboardId,
        billboardCode: item.billboardCode,
        reference: item.reference,
        departmentName: item.departmentName,
        cityName: item.cityName,
        address: item.address,
        price: item.price,
        from: item.from,
        to: item.to,
        digitalBillboardId: item.digitalBillboardId,
        spotCount: item.spotCount,
      })),
    };
  }

  async createPurchase(body: {
    paypalOrderId: string;
    email: string;
    items: IncomingItem[];
  }) {
    const { paypalOrderId, items } = body;
    const email = body.email.trim().toLowerCase();

    if (!paypalOrderId || !items?.length || !email) {
      throw new BadRequestException('Missing order id, items, or email');
    }

    for (const item of items) {
      if (isDigitalItem(item)) {
        if (!item.digitalBillboardId || !isDigitalSpotOption(item.spotCount)) {
          throw new BadRequestException('Item digital inválido');
        }
        const check = await this.shopService.assertDigitalAvailability(
          item.digitalBillboardId,
          new Date(item.from),
          new Date(item.to),
          item.spotCount,
        );
        if (!check.ok) {
          throw new ConflictException(check.message);
        }
      } else {
        if (
          item.billboardId == null ||
          !Number.isFinite(Number(item.billboardId))
        ) {
          throw new BadRequestException('Item estático inválido');
        }
      }
    }

    const customer = await this.prisma.customer.upsert({
      where: { email },
      update: {},
      create: { email },
    });

    const createRows = items.map((item) => {
      if (isDigitalItem(item)) {
        return {
          billboardId: null,
          digitalBillboardId: item.digitalBillboardId,
          spotCount: item.spotCount,
          billboardCode: item.billboardCode ?? undefined,
          reference: item.reference ?? undefined,
          departmentName: item.departmentName ?? undefined,
          cityName: item.cityName ?? undefined,
          address: item.address ?? undefined,
          price: item.price,
          from: new Date(item.from),
          to: new Date(item.to),
        };
      }
      return {
        billboardId: item.billboardId,
        digitalBillboardId: null,
        spotCount: null,
        billboardCode: item.billboardCode ?? undefined,
        reference: item.reference ?? undefined,
        departmentName: item.departmentName ?? undefined,
        cityName: item.cityName ?? undefined,
        address: item.address ?? undefined,
        price: item.price,
        from: new Date(item.from),
        to: new Date(item.to),
      };
    });

    const existing = await this.prisma.purchase.findFirst({
      where: { paypalOrderId },
    });

    const purchase = existing
      ? await this.prisma.purchase.update({
          where: { id: existing.id },
          data: {
            customerId: customer.id,
            items: { deleteMany: {}, create: createRows },
          },
          include: { items: true },
        })
      : await this.prisma.purchase.create({
          data: {
            status: 'COMPLETED',
            paypalOrderId,
            customerId: customer.id,
            items: { create: createRows },
          },
          include: { items: true },
        });

    return {
      id: purchase.id,
      paypalOrderId: purchase.paypalOrderId,
      itemCount: purchase.items.length,
    };
  }
}
