import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { UpdateMeDto } from './dto/update-me.dto.js';
import { UpdateMyTeamMemberDto } from './dto/update-my-team-member.dto.js';
import { formatTeamMemberFullName } from '../team-members/team-member-full-name.js';

const ME_PUBLIC_SELECT = {
  id: true,
  publicId: true,
  firstName: true,
  lastName: true,
  email: true,
  role: true,
  subRoles: true,
  createdAt: true,
  emailVerified: true,
  image: true,
} as const;

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

const ME_VISIBLE_COMMENT_SELECT = {
  id: true,
  comment: true,
  createdAt: true,
} as const;

@Injectable()
export class MeService {
  constructor(private readonly prisma: PrismaService) {}

  private async visibleCommentsForMember(teamMemberId: string) {
    return this.prisma.teamMemberComment.findMany({
      where: { teamMemberId, showToUser: true },
      orderBy: { createdAt: 'desc' },
      select: ME_VISIBLE_COMMENT_SELECT,
    });
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: ME_PUBLIC_SELECT,
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  async getTeamMember(userId: string) {
    const member = await this.prisma.teamMember.findUnique({
      where: { userId },
      select: TEAM_MEMBER_SELECT,
    });
    if (!member) return null;
    const teamMemberComments = await this.visibleCommentsForMember(member.id);
    return { ...member, teamMemberComments };
  }

  async updateMyTeamMember(userId: string, dto: UpdateMyTeamMemberDto) {
    const member = await this.prisma.teamMember.findUnique({
      where: { userId },
    });
    if (!member) {
      throw new NotFoundException(
        'No hay registro de plantilla asociado a tu usuario',
      );
    }

    const firstName = dto.firstName ?? member.firstName;
    const lastName =
      dto.lastName !== undefined ? dto.lastName ?? null : member.lastName;
    const secondLastName =
      dto.secondLastName !== undefined
        ? dto.secondLastName ?? null
        : member.secondLastName;

    const data: Prisma.TeamMemberUpdateInput = {
      firstName,
      lastName,
      secondLastName,
      fullName: formatTeamMemberFullName({
        firstName,
        lastName,
        secondLastName,
      }),
    };

    if (dto.bornDate !== undefined) {
      data.bornDate = dto.bornDate ? new Date(dto.bornDate) : null;
    }
    if (dto.dui !== undefined) data.dui = dto.dui || null;
    if (dto.inss !== undefined) data.inss = dto.inss || null;
    if (dto.emergencyContactName !== undefined) {
      data.emergencyContactName = dto.emergencyContactName || null;
    }
    if (dto.emergencyContactPhone !== undefined) {
      data.emergencyContactPhone = dto.emergencyContactPhone || null;
    }
    if (dto.emergencyContactRelationship !== undefined) {
      data.emergencyContactRelationship =
        dto.emergencyContactRelationship || null;
    }
    if (dto.bankName !== undefined) data.bankName = dto.bankName || null;
    if (dto.bankAccount !== undefined) {
      data.bankAccount = dto.bankAccount || null;
    }
    if (dto.afpNumber !== undefined) data.afpNumber = dto.afpNumber || null;
    if (dto.afpEntity !== undefined) data.afpEntity = dto.afpEntity || null;

    const updated = await this.prisma.teamMember.update({
      where: { userId },
      data,
      select: TEAM_MEMBER_SELECT,
    });
    const teamMemberComments = await this.visibleCommentsForMember(updated.id);
    return { ...updated, teamMemberComments };
  }

  async update(userId: string, dto: UpdateMeDto) {
    const { password, ...userData } = dto;

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: userData,
      select: ME_PUBLIC_SELECT,
    });

    if (password) {
      const { hashPassword } = await import('better-auth/crypto');
      const hashedPassword = await hashPassword(password);
      await this.prisma.account.updateMany({
        where: { userId, providerId: 'credential' },
        data: { password: hashedPassword },
      });
    }

    return user;
  }
}
