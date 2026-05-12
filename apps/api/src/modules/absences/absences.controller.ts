import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { RequiredSubRoles } from '../auth/decorators.js';
import { AbsencesService } from './absences.service.js';
import { UpdateAbsenceStatusDto } from './dto/update-absence-status.dto.js';

@RequiredSubRoles('HR')
@Controller('absences')
export class AbsencesController {
  constructor(private readonly absencesService: AbsencesService) {}

  @Get()
  async findAll() {
    const absences = await this.absencesService.findAll();
    return { data: absences };
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateAbsenceStatusDto,
  ) {
    const updated = await this.absencesService.updateStatus(id, dto.status);
    return { data: updated };
  }
}
