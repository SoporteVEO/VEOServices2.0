import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUserDto) {
    const exists = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (exists) throw new ConflictException('El correo ya está registrado');

    const { hashPassword } = await import('better-auth/crypto');

    const id = crypto.randomUUID();
    const hashedPassword = await hashPassword(dto.password);

    const user = await this.prisma.user.create({
      data: {
        id,
        firstName: dto.firstName,
        lastName: dto.lastName ?? null,
        email: dto.email,
        role: dto.role ?? 'USER',
        emailVerified: false,
      },
      select: {
        id: true,
        publicId: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        createdAt: true,
        emailVerified: true,
      },
    });

    await this.prisma.account.create({
      data: {
        id: crypto.randomUUID(),
        userId: id,
        accountId: id,
        providerId: 'credential',
        password: hashedPassword,
      },
    });

    return user;
  }

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        publicId: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        createdAt: true,
        emailVerified: true,
        image: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        publicId: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        createdAt: true,
        emailVerified: true,
        image: true,
      },
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findOne(id);

    if (dto.email) {
      const existing = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException('El correo ya está registrado');
      }
    }

    const { password, ...userData } = dto;

    const user = await this.prisma.user.update({
      where: { id },
      data: userData,
      select: {
        id: true,
        publicId: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        createdAt: true,
        emailVerified: true,
        image: true,
      },
    });

    if (password) {
      const { hashPassword } = await import('better-auth/crypto');
      const hashedPassword = await hashPassword(password);
      await this.prisma.account.updateMany({
        where: { userId: id, providerId: 'credential' },
        data: { password: hashedPassword },
      });
    }

    return user;
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.user.delete({ where: { id } });
    return { deleted: true };
  }
}
