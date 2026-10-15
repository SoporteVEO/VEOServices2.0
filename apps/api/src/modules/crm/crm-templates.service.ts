import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  buildTemplateVariables,
  renderEmailHtml,
  type TemplateVariables,
} from './crm-template-render.js';
import { USER_SUMMARY_SELECT, type CrmUserSummary } from './crm.constants.js';
import type {
  CreateTemplateDto,
  TemplateContextQueryDto,
  UpdateTemplateDto,
} from './dto/crm-template.dto.js';

export interface CrmTemplateItem {
  id: string;
  name: string;
  subject: string;
  body: string;
  category: string | null;
  isShared: boolean;
  isOwner: boolean;
  usageCount: number;
  owner: CrmUserSummary;
  createdAt: string;
  updatedAt: string;
}

const TEMPLATE_INCLUDE = {
  owner: { select: USER_SUMMARY_SELECT },
} as const satisfies Prisma.CrmEmailTemplateInclude;

type TemplateRow = Prisma.CrmEmailTemplateGetPayload<{
  include: typeof TEMPLATE_INCLUDE;
}>;

export function signatureFromMetadata(
  metadata: Prisma.JsonValue | null | undefined,
): string | null {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata))
    return null;
  const value = (metadata as Record<string, unknown>).signature;
  return typeof value === 'string' ? value : null;
}

@Injectable()
export class CrmTemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string): Promise<CrmTemplateItem[]> {
    const rows = await this.prisma.crmEmailTemplate.findMany({
      where: { OR: [{ ownerId: userId }, { isShared: true }] },
      include: TEMPLATE_INCLUDE,
      orderBy: [{ usageCount: 'desc' }, { name: 'asc' }],
    });
    return rows.map((row) => this.serialize(row, userId));
  }

  async get(id: string, userId: string): Promise<CrmTemplateItem> {
    const row = await this.findVisible(id, userId);
    return this.serialize(row, userId);
  }

  async create(
    dto: CreateTemplateDto,
    userId: string,
  ): Promise<CrmTemplateItem> {
    const row = await this.prisma.crmEmailTemplate.create({
      data: {
        name: dto.name.trim(),
        subject: dto.subject.trim(),
        body: dto.body,
        category: dto.category?.trim() || null,
        isShared: dto.isShared ?? false,
        ownerId: userId,
      },
      include: TEMPLATE_INCLUDE,
    });
    return this.serialize(row, userId);
  }

  async update(
    id: string,
    dto: UpdateTemplateDto,
    userId: string,
  ): Promise<CrmTemplateItem> {
    await this.findOwned(id, userId);
    const row = await this.prisma.crmEmailTemplate.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.subject !== undefined ? { subject: dto.subject.trim() } : {}),
        ...(dto.body !== undefined ? { body: dto.body } : {}),
        ...(dto.category !== undefined
          ? { category: dto.category?.trim() || null }
          : {}),
        ...(dto.isShared !== undefined ? { isShared: dto.isShared } : {}),
      },
      include: TEMPLATE_INCLUDE,
    });
    return this.serialize(row, userId);
  }

  async duplicate(id: string, userId: string): Promise<CrmTemplateItem> {
    const source = await this.findVisible(id, userId);
    const row = await this.prisma.crmEmailTemplate.create({
      data: {
        name: `${source.name} (copia)`.slice(0, 100),
        subject: source.subject,
        body: source.body,
        category: source.category,
        isShared: false,
        ownerId: userId,
      },
      include: TEMPLATE_INCLUDE,
    });
    return this.serialize(row, userId);
  }

  async remove(id: string, userId: string): Promise<{ deleted: true }> {
    await this.findOwned(id, userId);
    await this.prisma.crmEmailTemplate.delete({ where: { id } });
    return { deleted: true };
  }

  async markUsed(id: string): Promise<void> {
    await this.prisma.crmEmailTemplate.updateMany({
      where: { id },
      data: { usageCount: { increment: 1 } },
    });
  }

  /** Values for every `{{variable}}` given a deal, client and/or contact. */
  async context(
    query: { [K in keyof TemplateContextQueryDto]?: string | null },
    userId: string,
  ): Promise<TemplateVariables> {
    const deal = query.dealId
      ? await this.prisma.crmDeal.findUnique({
          where: { id: query.dealId },
          select: {
            title: true,
            value: true,
            expectedCloseDate: true,
            clientId: true,
            contactId: true,
            brand: true,
            mediaType: true,
            campaignStart: true,
            campaignEnd: true,
            stage: { select: { name: true } },
            sites: {
              where: { status: { not: 'RELEASED' } },
              orderBy: [{ kind: 'asc' }, { code: 'asc' }],
              select: {
                kind: true,
                code: true,
                label: true,
                cityName: true,
                spotsPerDay: true,
              },
            },
          },
        })
      : null;
    const clientId = query.clientId ?? deal?.clientId ?? null;
    const contactId = query.contactId ?? deal?.contactId ?? null;

    const [client, contact, sender] = await Promise.all([
      clientId
        ? this.prisma.client.findUnique({
            where: { id: clientId },
            select: { name: true, company: true, email: true },
          })
        : null,
      contactId
        ? this.prisma.crmContact.findUnique({
            where: { id: contactId },
            select: {
              firstName: true,
              lastName: true,
              email: true,
              jobTitle: true,
            },
          })
        : null,
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { firstName: true, lastName: true, email: true },
      }),
    ]);

    return buildTemplateVariables({
      client,
      contact,
      sender,
      deal: deal
        ? {
            title: deal.title,
            value: deal.value,
            stageName: deal.stage.name,
            expectedCloseDate: deal.expectedCloseDate,
            brand: deal.brand,
            mediaType: deal.mediaType,
            campaignStart: deal.campaignStart,
            campaignEnd: deal.campaignEnd,
            sites: deal.sites,
          }
        : null,
    });
  }

  async renderPreview(body: string, userId: string): Promise<{ html: string }> {
    const connection = await this.prisma.crmChannelConnection.findUnique({
      where: { userId_provider: { userId, provider: 'GMAIL' } },
      select: { metadata: true },
    });
    const html = await renderEmailHtml(
      body,
      signatureFromMetadata(connection?.metadata),
    );
    return { html };
  }

  private async findVisible(id: string, userId: string): Promise<TemplateRow> {
    const row = await this.prisma.crmEmailTemplate.findUnique({
      where: { id },
      include: TEMPLATE_INCLUDE,
    });
    if (!row || (!row.isShared && row.ownerId !== userId)) {
      throw new NotFoundException('Plantilla no encontrada');
    }
    return row;
  }

  private async findOwned(id: string, userId: string) {
    const row = await this.prisma.crmEmailTemplate.findUnique({
      where: { id },
      select: { ownerId: true },
    });
    if (!row) throw new NotFoundException('Plantilla no encontrada');
    if (row.ownerId !== userId) {
      throw new ForbiddenException(
        'Solo el autor puede modificar esta plantilla. Duplícala para editarla.',
      );
    }
    return row;
  }

  private serialize(row: TemplateRow, userId: string): CrmTemplateItem {
    return {
      id: row.id,
      name: row.name,
      subject: row.subject,
      body: row.body,
      category: row.category,
      isShared: row.isShared,
      isOwner: row.ownerId === userId,
      usageCount: row.usageCount,
      owner: row.owner,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
