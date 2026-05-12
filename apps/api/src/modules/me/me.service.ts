import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { UpdateMeDto } from './dto/update-me.dto.js';

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

const TEAM_MEMBER_SELECT = {
  id: true,
  userId: true,
  firstName: true,
  lastName: true,
  businessEmail: true,
  position: true,
  salary: true,
  vacations: true,
  usedVacations: true,
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
} as const;

@Injectable()
export class MeService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: ME_PUBLIC_SELECT,
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  async getTeamMember(userId: string) {
    return this.prisma.teamMember.findUnique({
      where: { userId },
      select: TEAM_MEMBER_SELECT,
    });
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
