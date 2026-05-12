import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateTeamMemberDto } from './dto/create-team-member.dto';
import { UpdateTeamMemberDto } from './dto/update-team-member.dto';

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
export class TeamMembersService {
  constructor(private readonly prisma: PrismaService) {}

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

    return this.prisma.teamMember.create({
      data: {
        userId: dto.userId,
        firstName: dto.firstName,
        lastName: dto.lastName ?? null,
        businessEmail: dto.businessEmail,
        position: dto.position,
        salary: dto.salary,
        vacations: dto.vacations,
        usedVacations: dto.usedVacations,
      },
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
      select: TEAM_MEMBER_SELECT,
    });
    if (!teamMember)
      throw new NotFoundException('Miembro de plantilla no encontrado');
    return teamMember;
  }

  async update(id: string, dto: UpdateTeamMemberDto) {
    await this.findOne(id);

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

    return this.prisma.teamMember.update({
      where: { id },
      data: dto,
      select: TEAM_MEMBER_SELECT,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.teamMember.delete({ where: { id } });
    return { deleted: true };
  }
}
