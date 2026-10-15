import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ProductionOrderStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { OCCUPYING_STATUSES } from './print-jobs.service.js';

export interface CreatePrintColorTestInput {
  productionOrderItemId: string;
  durationMinutes: number;
  notes?: string | null;
}

export interface PrintColorTestDto {
  id: string;
  productionOrderItemId: string;
  durationMinutes: number;
  notes: string | null;
  createdAt: string;
}

@Injectable()
export class PrintColorTestsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Queues a color test in the backlog; placing it on a machine is separate. */
  async create(
    input: CreatePrintColorTestInput,
    userId: string,
  ): Promise<PrintColorTestDto> {
    const item = await this.prisma.productionOrderItem.findUnique({
      where: { id: input.productionOrderItemId },
      select: { id: true, status: true },
    });
    if (!item) {
      throw new NotFoundException('Valla de producción no encontrada');
    }
    if (item.status === ProductionOrderStatus.CANCELLED) {
      throw new BadRequestException(
        'No se puede crear una prueba de color para una valla cancelada',
      );
    }

    const created = await this.prisma.printColorTest.create({
      data: {
        productionOrderItemId: item.id,
        durationMinutes: input.durationMinutes,
        notes: input.notes?.trim() || null,
        createdByUserId: userId,
      },
    });

    return {
      id: created.id,
      productionOrderItemId: created.productionOrderItemId,
      durationMinutes: created.durationMinutes,
      notes: created.notes,
      createdAt: created.createdAt.toISOString(),
    };
  }

  /** Discards a color test that is still waiting in the backlog. */
  async remove(colorTestId: string): Promise<void> {
    const test = await this.prisma.printColorTest.findUnique({
      where: { id: colorTestId },
      select: {
        id: true,
        printJobs: {
          where: { status: { in: OCCUPYING_STATUSES } },
          select: { id: true },
          take: 1,
        },
      },
    });
    if (!test) throw new NotFoundException('Prueba de color no encontrada');
    if (test.printJobs.length > 0) {
      throw new BadRequestException(
        'La prueba de color ya está en el calendario; elimínala desde ahí',
      );
    }
    await this.prisma.printColorTest.delete({ where: { id: test.id } });
  }
}
