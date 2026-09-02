import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { DEFAULT_PRINT_SPEED_M2_PER_HOUR } from './print-time.js';

export interface PrintingMachineDto {
  id: string;
  name: string;
  position: number;
  setupMinutes: number;
  cooldownMinutes: number;
  printSpeedM2PerHour: number;
  dailyCapacityM2: number;
  isActive: boolean;
}

const MACHINE_SELECT = {
  id: true,
  name: true,
  position: true,
  setupMinutes: true,
  cooldownMinutes: true,
  printSpeedM2PerHour: true,
  dailyCapacityM2: true,
  isActive: true,
} as const;

/**
 * Shop floor starts with the press it actually owns; names, throughput and
 * capacity are editable afterwards.
 */
const DEFAULT_MACHINES = [
  { name: 'Máquina 1', position: 0 },
  { name: 'Máquina 2', position: 1 },
] as const;

@Injectable()
export class PrintingMachinesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creates the initial presses the first time the calendar is opened. Runs on
   * every read but only writes when the table is empty, which keeps fresh
   * environments usable without a seed script.
   */
  async ensureDefaults(): Promise<void> {
    const machineCount = await this.prisma.printingMachine.count();
    if (machineCount > 0) return;

    await this.prisma.printingMachine.createMany({
      data: DEFAULT_MACHINES.map((machine) => ({ ...machine })),
    });
  }

  async listMachines(): Promise<PrintingMachineDto[]> {
    await this.ensureDefaults();
    return this.prisma.printingMachine.findMany({
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
      select: MACHINE_SELECT,
    });
  }

  async createMachine(input: {
    name: string;
    setupMinutes?: number;
    cooldownMinutes?: number;
    printSpeedM2PerHour?: number;
    dailyCapacityM2?: number;
  }): Promise<PrintingMachineDto> {
    const last = await this.prisma.printingMachine.findFirst({
      orderBy: { position: 'desc' },
      select: { position: true },
    });

    return this.prisma.printingMachine.create({
      data: {
        name: input.name.trim(),
        position: (last?.position ?? -1) + 1,
        ...optionalFields(input),
      },
      select: MACHINE_SELECT,
    });
  }

  async updateMachine(
    id: string,
    input: {
      name?: string;
      setupMinutes?: number;
      cooldownMinutes?: number;
      printSpeedM2PerHour?: number;
      dailyCapacityM2?: number;
      isActive?: boolean;
    },
  ): Promise<PrintingMachineDto> {
    const existing = await this.prisma.printingMachine.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('Máquina no encontrada');

    return this.prisma.printingMachine.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
        ...optionalFields(input),
      },
      select: MACHINE_SELECT,
    });
  }

  async deleteMachine(id: string): Promise<void> {
    const machine = await this.prisma.printingMachine.findUnique({
      where: { id },
      select: { id: true, _count: { select: { printJobs: true } } },
    });
    if (!machine) throw new NotFoundException('Máquina no encontrada');
    if (machine._count.printJobs > 0) {
      throw new BadRequestException(
        'La máquina tiene trabajos registrados; desactívala en lugar de eliminarla',
      );
    }
    await this.prisma.printingMachine.delete({ where: { id } });
  }
}

/**
 * A press that reports a non-positive throughput would make every print time
 * infinite, so the seeded default stands in.
 */
export function effectivePrintSpeed(speedM2PerHour: number): number {
  return speedM2PerHour > 0 ? speedM2PerHour : DEFAULT_PRINT_SPEED_M2_PER_HOUR;
}

function optionalFields(input: {
  setupMinutes?: number;
  cooldownMinutes?: number;
  printSpeedM2PerHour?: number;
  dailyCapacityM2?: number;
}) {
  return {
    ...(input.setupMinutes !== undefined
      ? { setupMinutes: input.setupMinutes }
      : {}),
    ...(input.cooldownMinutes !== undefined
      ? { cooldownMinutes: input.cooldownMinutes }
      : {}),
    ...(input.printSpeedM2PerHour !== undefined
      ? { printSpeedM2PerHour: input.printSpeedM2PerHour }
      : {}),
    ...(input.dailyCapacityM2 !== undefined
      ? { dailyCapacityM2: input.dailyCapacityM2 }
      : {}),
  };
}
