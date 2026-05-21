import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateClientDto } from './dto/create-client.dto.js';

export interface ClientListItem {
  id: string;
  name: string;
  company: string | null;
  email: string;
  contact: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ListClientsFilters {
  search?: string;
  cursor?: string;
  limit?: number;
}

export interface PaginatedClients {
  data: ClientListItem[];
  nextCursor: string | null;
}

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

function clampLimit(value: number | undefined): number {
  if (!value || !Number.isFinite(value)) return DEFAULT_PAGE_SIZE;
  return Math.min(Math.max(Math.floor(value), 1), MAX_PAGE_SIZE);
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(filters: ListClientsFilters = {}): Promise<PaginatedClients> {
    const limit = clampLimit(filters.limit);
    const search = filters.search?.trim();

    const where: Prisma.ClientWhereInput = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { company: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { contact: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

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

  async findById(id: string): Promise<ClientListItem> {
    const row = await this.prisma.client.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Cliente no encontrado');
    return this.toListItem(row);
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
      if (Object.keys(updates).length === 0) {
        return this.toListItem(existing);
      }
      const updated = await this.prisma.client.update({
        where: { id: existing.id },
        data: updates,
      });
      return this.toListItem(updated);
    }

    const created = await this.prisma.client.create({
      data: {
        name: dto.name.trim(),
        company: dto.company?.trim() || null,
        email,
        contact: dto.contact?.trim() || null,
      },
    });
    return this.toListItem(created);
  }

  async create(dto: CreateClientDto): Promise<ClientListItem> {
    return this.upsertByEmail(dto);
  }

  private toListItem(row: {
    id: string;
    name: string;
    company: string | null;
    email: string;
    contact: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): ClientListItem {
    return {
      id: row.id,
      name: row.name,
      company: row.company,
      email: row.email,
      contact: row.contact,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
