import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { ClientType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateClientDto } from './dto/create-client.dto.js';
import { UpdateClientDto } from './dto/update-client.dto.js';

export interface ClientListItem {
  id: string;
  type: ClientType;
  name: string;
  company: string | null;
  email: string;
  billingEmail: string | null;
  contact: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ListClientsFilters {
  search?: string;
  type?: ClientType;
  cursor?: string;
  limit?: number;
}

export interface ListClientsPageFilters {
  search?: string;
  type?: ClientType;
  page?: number;
  pageSize?: number;
}

export interface PaginatedClients {
  data: ClientListItem[];
  nextCursor: string | null;
}

export interface PaginatedClientsPage {
  data: ClientListItem[];
  total: number;
  page: number;
  pageSize: number;
}

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

function clampLimit(value: number | undefined): number {
  if (!value || !Number.isFinite(value)) return DEFAULT_PAGE_SIZE;
  return Math.min(Math.max(Math.floor(value), 1), MAX_PAGE_SIZE);
}

function clampPage(value: number | undefined): number {
  if (!value || !Number.isFinite(value)) return 1;
  return Math.max(Math.floor(value), 1);
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function buildWhere(
  search: string | undefined,
  type: ClientType | undefined,
): Prisma.ClientWhereInput {
  const where: Prisma.ClientWhereInput = {};
  if (type) where.type = type;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { company: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { billingEmail: { contains: search, mode: 'insensitive' } },
      { contact: { contains: search, mode: 'insensitive' } },
    ];
  }
  return where;
}

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(filters: ListClientsFilters = {}): Promise<PaginatedClients> {
    const limit = clampLimit(filters.limit);
    const where = buildWhere(filters.search?.trim(), filters.type);

    const rows = await this.prisma.client.findMany({
      where,
      take: limit + 1,
      ...(filters.cursor ? { skip: 1, cursor: { id: filters.cursor } } : {}),
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
    });

    const hasMore = rows.length > limit;
    const pageRows = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor =
      hasMore && pageRows.length > 0 ? pageRows[pageRows.length - 1].id : null;

    return {
      data: pageRows.map((row) => this.toListItem(row)),
      nextCursor,
    };
  }

  async listPage(
    filters: ListClientsPageFilters = {},
  ): Promise<PaginatedClientsPage> {
    const page = clampPage(filters.page);
    const pageSize = clampLimit(filters.pageSize);
    const where = buildWhere(filters.search?.trim(), filters.type);

    const [rows, total] = await Promise.all([
      this.prisma.client.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
      }),
      this.prisma.client.count({ where }),
    ]);

    return {
      data: rows.map((row) => this.toListItem(row)),
      total,
      page,
      pageSize,
    };
  }

  async findById(id: string): Promise<ClientListItem> {
    const row = await this.prisma.client.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Cliente no encontrado');
    return this.toListItem(row);
  }

  async update(id: string, dto: UpdateClientDto): Promise<ClientListItem> {
    const existing = await this.prisma.client.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Cliente no encontrado');

    const data: Prisma.ClientUpdateInput = {};

    if (dto.type !== undefined && dto.type !== existing.type) {
      data.type = dto.type;
    }

    if (dto.name !== undefined) {
      const trimmed = dto.name.trim();
      if (!trimmed) {
        throw new ConflictException('El nombre no puede estar vacío');
      }
      data.name = trimmed;
    }

    if (dto.company !== undefined) {
      data.company = dto.company === null ? null : dto.company.trim() || null;
    }

    if (dto.email !== undefined) {
      const normalized = normalizeEmail(dto.email);
      if (normalized !== existing.email) {
        const collision = await this.prisma.client.findUnique({
          where: { email: normalized },
        });
        if (collision && collision.id !== id) {
          throw new ConflictException(
            'Ya existe otro cliente con ese correo electrónico',
          );
        }
      }
      data.email = normalized;
    }

    if (dto.billingEmail !== undefined) {
      data.billingEmail =
        dto.billingEmail === null
          ? null
          : normalizeEmail(dto.billingEmail) || null;
    }

    if (dto.contact !== undefined) {
      data.contact = dto.contact === null ? null : dto.contact.trim() || null;
    }

    if (Object.keys(data).length === 0) {
      return this.toListItem(existing);
    }

    const updated = await this.prisma.client.update({ where: { id }, data });
    return this.toListItem(updated);
  }

  /**
   * Creates a client or returns the existing one matching by email. This is
   * the idempotent operation used by the quotation flow so submitting an
   * existing email simply attaches that client to the new offer.
   */
  async upsertByEmail(dto: CreateClientDto): Promise<ClientListItem> {
    const email = normalizeEmail(dto.email);
    const existing = await this.prisma.client.findUnique({ where: { email } });

    if (existing) {
      const updates: Prisma.ClientUpdateInput = {};
      if (dto.type && dto.type !== existing.type) {
        updates.type = dto.type;
      }
      if (dto.name?.trim() && existing.name !== dto.name.trim()) {
        updates.name = dto.name.trim();
      }
      const company = dto.company?.trim() || null;
      if (company !== existing.company) {
        updates.company = company;
      }
      const contact = dto.contact?.trim() || null;
      if (contact !== existing.contact) {
        updates.contact = contact;
      }
      const billingEmail = dto.billingEmail?.trim()
        ? normalizeEmail(dto.billingEmail)
        : null;
      if (billingEmail !== existing.billingEmail) {
        updates.billingEmail = billingEmail;
      }
      if (Object.keys(updates).length === 0) {
        return this.toListItem(existing);
      }
      const updated = await this.prisma.client.update({
        where: { id: existing.id },
        data: updates,
      });
      return this.toListItem(updated);
    }

    return this.insert(dto, email);
  }

  async create(dto: CreateClientDto): Promise<ClientListItem> {
    const email = normalizeEmail(dto.email);
    const existing = await this.prisma.client.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException(
        'Ya existe un cliente con ese correo electrónico',
      );
    }
    return this.insert(dto, email);
  }

  private async insert(
    dto: CreateClientDto,
    email: string,
  ): Promise<ClientListItem> {
    const created = await this.prisma.client.create({
      data: {
        type: dto.type ?? 'DIRECT',
        name: dto.name.trim(),
        company: dto.company?.trim() || null,
        email,
        billingEmail: dto.billingEmail?.trim()
          ? normalizeEmail(dto.billingEmail)
          : null,
        contact: dto.contact?.trim() || null,
      },
    });
    return this.toListItem(created);
  }

  private toListItem(row: {
    id: string;
    type: ClientType;
    name: string;
    company: string | null;
    email: string;
    billingEmail: string | null;
    contact: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): ClientListItem {
    return {
      id: row.id,
      type: row.type,
      name: row.name,
      company: row.company,
      email: row.email,
      billingEmail: row.billingEmail,
      contact: row.contact,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
