import { Module } from '@nestjs/common';
import { PatchNotesController } from './patch-notes.controller.js';
import { PatchNotesService } from './patch-notes.service.js';

@Module({
  controllers: [PatchNotesController],
  providers: [PatchNotesService],
})
export class PatchNotesModule {}
