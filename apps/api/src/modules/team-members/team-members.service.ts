import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { ContractType, TeamMemberStatus } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateTeamMemberCommentDto } from './dto/create-team-member-comment.dto';
import { CreateTeamMemberDto } from './dto/create-team-member.dto';
import { UpdateTeamMemberDto } from './dto/update-team-member.dto';
import { formatTeamMemberFullName } from './team-member-full-name';

const TEAM_MEMBER_DIRECT_BOSS_SELECT = {
  select: {
    id: true,
    firstName: true,
    lastName: true,
    email: true,
  },
} as const;

const TEAM_MEMBER_SELECT = {
  id: true,
  userId: true,
  firstName: true,
  lastName: true,
  secondLastName: true,
  fullName: true,
  dui: true,
  inss: true,
  afpNumber: true,
  afpEntity: true,
  bankName: true,
  bankAccount: true,
  bornDate: true,
  startDate: true,
  endDate: true,
  contractType: true,
  status: true,
  emergencyContactName: true,
  emergencyContactPhone: true,
  emergencyContactRelationship: true,
  directBossId: true,
  businessEmail: true,
  position: true,
  salary: true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
    },
  },
  directBoss: TEAM_MEMBER_DIRECT_BOSS_SELECT,
} as const;

const TEAM_MEMBER_COMMENT_LIST_SELECT = {
  id: true,
  teamMemberId: true,
  comment: true,
  showToUser: true,
  createdAt: true,
  updatedAt: true,
} as const;

const TEAM_MEMBER_DETAIL_SELECT = {
  ...TEAM_MEMBER_SELECT,
  teamMemberComments: {
    orderBy: { createdAt: 'desc' as const },
    select: TEAM_MEMBER_COMMENT_LIST_SELECT,
  },
} as const;

@Injectable()
export class TeamMembersService {
  private readonly logger = new Logger(TeamMembersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  private async assertDirectBossValid(
    directBossId: string | null | undefined,
    teamMemberUserId: string,
  ) {
    if (directBossId == null || directBossId === '') return;
    const boss = await this.prisma.user.findUnique({
      where: { id: directBossId },
    });
    if (!boss) throw new NotFoundException('Jefe directo no encontrado');
    if (boss.id === teamMemberUserId) {
      throw new BadRequestException(
        'El colaborador no puede ser su propio jefe directo',
      );
    }
  }

  async create(dto: CreateTeamMemberDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const existingForUser = await this.prisma.teamMember.findUnique({
      where: { userId: dto.userId },
    });
    if (existingForUser) {
      throw new ConflictException(
        'Este usuario ya está registrado en la plantilla',
      );
    }

    const existingEmail = await this.prisma.teamMember.findUnique({
      where: { businessEmail: dto.businessEmail },
    });
    if (existingEmail) {
      throw new ConflictException('El correo corporativo ya está en uso');
    }

    await this.assertDirectBossValid(dto.directBossId ?? null, dto.userId);

    const fullName = formatTeamMemberFullName({
      firstName: dto.firstName,
      lastName: dto.lastName,
      secondLastName: dto.secondLastName,
    });

    const data: Prisma.TeamMemberCreateInput = {
      user: { connect: { id: dto.userId } },
      firstName: dto.firstName,
      lastName: dto.lastName ?? null,
      secondLastName: dto.secondLastName ?? null,
      fullName,
      dui: dto.dui ?? null,
      inss: dto.inss ?? null,
      afpNumber: dto.afpNumber ?? null,
      afpEntity: dto.afpEntity ?? null,
      bankName: dto.bankName ?? null,
      bankAccount: dto.bankAccount ?? null,
      bornDate: dto.bornDate != null ? new Date(dto.bornDate) : null,
      startDate: dto.startDate != null ? new Date(dto.startDate) : null,
      endDate: dto.endDate != null ? new Date(dto.endDate) : null,
      contractType: dto.contractType ?? ContractType.FULL_TIME,
      status: dto.status ?? TeamMemberStatus.ACTIVE,
      emergencyContactName: dto.emergencyContactName ?? null,
      emergencyContactPhone: dto.emergencyContactPhone ?? null,
      emergencyContactRelationship: dto.emergencyContactRelationship ?? null,
      businessEmail: dto.businessEmail,
      position: dto.position,
      salary: dto.salary,
      ...(dto.directBossId
        ? { directBoss: { connect: { id: dto.directBossId } } }
        : {}),
    };

    return this.prisma.teamMember.create({
      data,
      select: TEAM_MEMBER_SELECT,
    });
  }

  async findAll() {
    return this.prisma.teamMember.findMany({
      select: TEAM_MEMBER_SELECT,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const teamMember = await this.prisma.teamMember.findUnique({
      where: { id },
      select: TEAM_MEMBER_DETAIL_SELECT,
    });
    if (!teamMember)
      throw new NotFoundException('Miembro de plantilla no encontrado');
    return teamMember;
  }

  async addComment(teamMemberId: string, dto: CreateTeamMemberCommentDto) {
    const member = await this.prisma.teamMember.findUnique({
      where: { id: teamMemberId },
      select: { id: true, userId: true },
    });
    if (!member) {
      throw new NotFoundException('Miembro de plantilla no encontrado');
    }

    const showToUser = dto.showToUser ?? false;

    const created = await this.prisma.teamMemberComment.create({
      data: {
        teamMemberId,
        comment: dto.comment,
        showToUser,
      },
      select: TEAM_MEMBER_COMMENT_LIST_SELECT,
    });

    if (showToUser) {
      try {
        await this.notifications.createOne({
          userId: member.userId,
          description: 'Recursos humanos te dejó un comentario en tu perfil.',
          priority: 'MEDIUM',
        });
      } catch (err) {
        this.logger.warn(
          `No se pudo crear la notificación de comentario HR para el usuario ${member.userId}`,
          err instanceof Error ? err.stack : err,
        );
      }
    }

    return created;
  }

  async update(id: string, dto: UpdateTeamMemberDto) {
    const member = await this.prisma.teamMember.findUnique({ where: { id } });
    if (!member)
      throw new NotFoundException('Miembro de plantilla no encontrado');

    if (dto.userId) {
      const existingForUser = await this.prisma.teamMember.findUnique({
        where: { userId: dto.userId },
      });
      if (existingForUser && existingForUser.id !== id) {
        throw new ConflictException(
          'Este usuario ya está registrado en la plantilla',
        );
      }
    }

    if (dto.businessEmail) {
      const existingEmail = await this.prisma.teamMember.findUnique({
        where: { businessEmail: dto.businessEmail },
      });
      if (existingEmail && existingEmail.id !== id) {
        throw new ConflictException('El correo corporativo ya está en uso');
      }
    }

    const targetUserId = dto.userId ?? member.userId;
    await this.assertDirectBossValid(dto.directBossId ?? null, targetUserId);

    const firstName = dto.firstName ?? member.firstName;
    const lastName =
      dto.lastName !== undefined ? (dto.lastName ?? null) : member.lastName;
    const secondLastName =
      dto.secondLastName !== undefined
        ? (dto.secondLastName ?? null)
        : member.secondLastName;

    const fullName = formatTeamMemberFullName({
      firstName,
      lastName,
      secondLastName,
    });

    const data: Prisma.TeamMemberUpdateInput = {
      firstName,
      lastName,
      secondLastName,
      fullName,
      ...(dto.userId ? { user: { connect: { id: dto.userId } } } : {}),
      ...(dto.businessEmail !== undefined
        ? { businessEmail: dto.businessEmail }
        : {}),
      ...(dto.position !== undefined ? { position: dto.position } : {}),
      ...(dto.salary !== undefined ? { salary: dto.salary } : {}),
      ...(dto.dui !== undefined ? { dui: dto.dui || null } : {}),
      ...(dto.inss !== undefined ? { inss: dto.inss || null } : {}),
      ...(dto.afpNumber !== undefined
        ? { afpNumber: dto.afpNumber || null }
        : {}),
      ...(dto.afpEntity !== undefined
        ? { afpEntity: dto.afpEntity || null }
        : {}),
      ...(dto.bankName !== undefined ? { bankName: dto.bankName || null } : {}),
      ...(dto.bankAccount !== undefined
        ? { bankAccount: dto.bankAccount || null }
        : {}),
      ...(dto.bornDate !== undefined
        ? { bornDate: dto.bornDate ? new Date(dto.bornDate) : null }
        : {}),
      ...(dto.startDate !== undefined
        ? { startDate: dto.startDate ? new Date(dto.startDate) : null }
        : {}),
      ...(dto.endDate !== undefined
        ? { endDate: dto.endDate ? new Date(dto.endDate) : null }
        : {}),
      ...(dto.contractType !== undefined
        ? { contractType: dto.contractType }
        : {}),
      ...(dto.status !== undefined ? { status: dto.status } : {}),
      ...(dto.emergencyContactName !== undefined
        ? { emergencyContactName: dto.emergencyContactName || null }
        : {}),
      ...(dto.emergencyContactPhone !== undefined
        ? { emergencyContactPhone: dto.emergencyContactPhone || null }
        : {}),
      ...(dto.emergencyContactRelationship !== undefined
        ? {
            emergencyContactRelationship:
              dto.emergencyContactRelationship || null,
          }
        : {}),
      ...(dto.directBossId !== undefined
        ? dto.directBossId
          ? { directBoss: { connect: { id: dto.directBossId } } }
          : { directBoss: { disconnect: true } }
        : {}),
    };

    return this.prisma.teamMember.update({
      where: { id },
      data,
      select: TEAM_MEMBER_SELECT,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.teamMember.delete({ where: { id } });
    return { deleted: true };
  }
}
