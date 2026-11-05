import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

export type HrCatalogKind = 'departments' | 'positions';

const CATALOG_ENTRY_SELECT = { id: true, name: true } as const;

@Injectable()
export class HrCatalogsService {
  constructor(private readonly prisma: PrismaService) {}

  list(kind: HrCatalogKind) {
    const args = {
      select: CATALOG_ENTRY_SELECT,
      orderBy: { name: 'asc' as const },
    };
    return kind === 'departments'
      ? this.prisma.hrDepartment.findMany(args)
      : this.prisma.hrPosition.findMany(args);
  }

  /** Returns the existing entry when the name already exists in any casing. */
  async create(kind: HrCatalogKind, rawName: string) {
    const name = rawName.trim().replace(/\s+/g, ' ');
    const lookup = {
      where: { name: { equals: name, mode: 'insensitive' as const } },
      select: CATALOG_ENTRY_SELECT,
    };
    const existing =
      kind === 'departments'
        ? await this.prisma.hrDepartment.findFirst(lookup)
        : await this.prisma.hrPosition.findFirst(lookup);
    if (existing) return existing;

    const create = { data: { name }, select: CATALOG_ENTRY_SELECT };
    return kind === 'departments'
      ? this.prisma.hrDepartment.create(create)
      : this.prisma.hrPosition.create(create);
  }
}
