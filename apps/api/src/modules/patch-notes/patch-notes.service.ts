import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type {
  CreatePatchNoteDto,
  UpdatePatchNoteDto,
} from './dto/patch-notes.dto.js';

export const DEVELOPER_SUB_ROLE = 'DESARROLLADOR';
export const PATCH_NOTES_HREF = '/dashboard/actualizaciones';

const PATCH_NOTE_SELECT = {
  id: true,
  version: true,
  title: true,
  body: true,
  createdAt: true,
  updatedAt: true,
  createdBy: { select: { id: true, firstName: true, lastName: true } },
} as const;

@Injectable()
export class PatchNotesService {
  private readonly logger = new Logger(PatchNotesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  list() {
    return this.prisma.patchNote.findMany({
      orderBy: { createdAt: 'desc' },
      select: PATCH_NOTE_SELECT,
    });
  }

  async currentVersion() {
    const latest = await this.prisma.patchNote.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { version: true },
    });
    return { version: latest?.version ?? null };
  }

  async create(dto: CreatePatchNoteDto, userId: string) {
    const note = await this.prisma.patchNote
      .create({
        data: {
          version: dto.version,
          title: dto.title.trim(),
          body: dto.body.trim(),
          createdById: userId,
        },
        select: PATCH_NOTE_SELECT,
      })
      .catch((error: unknown) => {
        throw this.translateError(error);
      });

    await this.notifyEveryone(note.version, note.title);
    return note;
  }

  async update(id: string, dto: UpdatePatchNoteDto) {
    await this.ensureExists(id);
    return this.prisma.patchNote
      .update({
        where: { id },
        data: {
          version: dto.version,
          title: dto.title?.trim(),
          body: dto.body?.trim(),
        },
        select: PATCH_NOTE_SELECT,
      })
      .catch((error: unknown) => {
        throw this.translateError(error);
      });
  }

  async remove(id: string) {
    await this.ensureExists(id);
    await this.prisma.patchNote.delete({ where: { id } });
  }

  private async ensureExists(id: string) {
    const found = await this.prisma.patchNote.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!found) throw new NotFoundException('Actualización no encontrada');
  }

  private async notifyEveryone(version: string, title: string) {
    try {
      const result = await this.notifications.createForAllUsers(
        `Nueva actualización ${version}: ${title}`,
        'MEDIUM',
        PATCH_NOTES_HREF,
      );
      this.logger.log(
        `Created ${result.count} notification(s) for patch note ${version}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to notify users of patch note ${version}`,
        error instanceof Error ? error.stack : error,
      );
    }
  }

  private translateError(error: unknown): unknown {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      return new ConflictException(
        'Ya existe una actualización con esa versión',
      );
    }
    return error;
  }
}
