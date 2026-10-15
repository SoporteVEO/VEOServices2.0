import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { normalizePhone } from './crm.constants.js';
import type {
  CreateContactDto,
  ListContactsQueryDto,
  UpdateContactDto,
} from './dto/crm-contact.dto.js';

export interface CrmContactItem {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  jobTitle: string | null;
  notes: string | null;
  isPrimary: boolean;
  client: { id: string; name: string; company: string | null } | null;
  openDeals: number;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedContacts {
  data: CrmContactItem[];
  total: number;
  page: number;
  pageSize: number;
}

const CONTACT_INCLUDE = {
  client: { select: { id: true, name: true, company: true } },
  _count: { select: { deals: { where: { status: 'OPEN' } } } },
} as const satisfies Prisma.CrmContactInclude;

type ContactRow = Prisma.CrmContactGetPayload<{
  include: typeof CONTACT_INCLUDE;
}>;

function clean(value: string | null | undefined): string | null | undefined {
  if (value === undefined) return undefined;
  return value?.trim() || null;
}

@Injectable()
export class CrmContactsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListContactsQueryDto): Promise<PaginatedContacts> {
    const page = Math.max(Number(query.page) || 1, 1);
    const pageSize = Math.min(Math.max(Number(query.pageSize) || 25, 1), 100);
    const where: Prisma.CrmContactWhereInput = {};
    if (query.clientId) where.clientId = query.clientId;
    const term = query.search?.trim();
    if (term) {
      where.OR = [
        { firstName: { contains: term, mode: 'insensitive' } },
        { lastName: { contains: term, mode: 'insensitive' } },
        { email: { contains: term, mode: 'insensitive' } },
        { phone: { contains: term } },
        { jobTitle: { contains: term, mode: 'insensitive' } },
        { client: { name: { contains: term, mode: 'insensitive' } } },
        { client: { company: { contains: term, mode: 'insensitive' } } },
      ];
    }

    const [rows, total] = await Promise.all([
      this.prisma.crmContact.findMany({
        where,
        include: CONTACT_INCLUDE,
        orderBy: [{ isPrimary: 'desc' }, { firstName: 'asc' }, { id: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.crmContact.count({ where }),
    ]);
    return {
      data: rows.map((row) => this.serialize(row)),
      total,
      page,
      pageSize,
    };
  }

  async get(id: string): Promise<CrmContactItem> {
    const row = await this.prisma.crmContact.findUnique({
      where: { id },
      include: CONTACT_INCLUDE,
    });
    if (!row) throw new NotFoundException('Contacto no encontrado');
    return this.serialize(row);
  }

  async create(dto: CreateContactDto): Promise<CrmContactItem> {
    await this.assertClient(dto.clientId);
    const created = await this.prisma.$transaction(async (tx) => {
      if (dto.isPrimary && dto.clientId) {
        await tx.crmContact.updateMany({
          where: { clientId: dto.clientId },
          data: { isPrimary: false },
        });
      }
      return tx.crmContact.create({
        data: {
          clientId: dto.clientId ?? null,
          firstName: dto.firstName.trim(),
          lastName: clean(dto.lastName) ?? null,
          email: clean(dto.email)?.toLowerCase() ?? null,
          phone: clean(dto.phone) ?? null,
          whatsapp: normalizePhone(dto.whatsapp ?? dto.phone),
          jobTitle: clean(dto.jobTitle) ?? null,
          notes: clean(dto.notes) ?? null,
          isPrimary: dto.isPrimary ?? false,
        },
        select: { id: true },
      });
    });
    return this.get(created.id);
  }

  async update(id: string, dto: UpdateContactDto): Promise<CrmContactItem> {
    const existing = await this.prisma.crmContact.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Contacto no encontrado');
    if (dto.clientId !== undefined) await this.assertClient(dto.clientId);

    const data: Prisma.CrmContactUncheckedUpdateInput = {};
    if (dto.clientId !== undefined) data.clientId = dto.clientId;
    if (dto.firstName !== undefined) data.firstName = dto.firstName.trim();
    if (dto.lastName !== undefined) data.lastName = clean(dto.lastName);
    if (dto.email !== undefined)
      data.email = clean(dto.email)?.toLowerCase() ?? null;
    if (dto.phone !== undefined) data.phone = clean(dto.phone);
    if (dto.whatsapp !== undefined)
      data.whatsapp = normalizePhone(dto.whatsapp);
    if (dto.jobTitle !== undefined) data.jobTitle = clean(dto.jobTitle);
    if (dto.notes !== undefined) data.notes = clean(dto.notes);
    if (dto.isPrimary !== undefined) data.isPrimary = dto.isPrimary;

    const clientId =
      dto.clientId === undefined ? existing.clientId : dto.clientId;
    await this.prisma.$transaction(async (tx) => {
      if (dto.isPrimary && clientId) {
        await tx.crmContact.updateMany({
          where: { clientId, id: { not: id } },
          data: { isPrimary: false },
        });
      }
      await tx.crmContact.update({ where: { id }, data });
    });
    return this.get(id);
  }

  async remove(id: string): Promise<{ deleted: true }> {
    const found = await this.prisma.crmContact.count({ where: { id } });
    if (!found) throw new NotFoundException('Contacto no encontrado');
    await this.prisma.crmContact.delete({ where: { id } });
    return { deleted: true };
  }

  private async assertClient(clientId: string | null | undefined) {
    if (!clientId) return;
    const exists = await this.prisma.client.count({ where: { id: clientId } });
    if (!exists) throw new BadRequestException('Cliente no encontrado');
  }

  private serialize(row: ContactRow): CrmContactItem {
    return {
      id: row.id,
      firstName: row.firstName,
      lastName: row.lastName,
      email: row.email,
      phone: row.phone,
      whatsapp: row.whatsapp,
      jobTitle: row.jobTitle,
      notes: row.notes,
      isPrimary: row.isPrimary,
      client: row.client,
      openDeals: row._count.deals,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
