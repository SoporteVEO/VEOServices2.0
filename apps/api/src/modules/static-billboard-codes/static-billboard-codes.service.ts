import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateStaticBillboardCodeDto } from './dto/create-static-billboard-code.dto.js';

export interface StaticBillboardCodeListItem {
  id: string;
  code: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class StaticBillboardCodesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<StaticBillboardCodeListItem[]> {
    const rows = await this.prisma.staticBillboardCodes.findMany({
      orderBy: { code: 'asc' },
    });

    return rows.map((row) => ({
      id: row.id,
      code: row.code,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    }));
  }

  async findOne(id: string): Promise<StaticBillboardCodeListItem> {
    const row = await this.prisma.staticBillboardCodes.findUnique({
      where: { id },
    });
    if (!row) throw new NotFoundException('Código de valla no encontrado');
    return {
      id: row.id,
      code: row.code,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async create(
    dto: CreateStaticBillboardCodeDto,
  ): Promise<StaticBillboardCodeListItem> {
    const code = dto.code.trim().toUpperCase();

    const existing = await this.prisma.staticBillboardCodes.findUnique({
      where: { code },
    });
    if (existing) {
      throw new ConflictException(`El código "${code}" ya existe.`);
    }

    try {
      const row = await this.prisma.staticBillboardCodes.create({
        data: { code },
      });
      return {
        id: row.id,
        code: row.code,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      };
    } catch (e: unknown) {
      if (
        typeof e === 'object' &&
        e !== null &&
        'code' in e &&
        (e as { code: string }).code === 'P2002'
      ) {
        throw new ConflictException(`El código "${code}" ya existe.`);
      }
      throw e;
    }
  }
}
