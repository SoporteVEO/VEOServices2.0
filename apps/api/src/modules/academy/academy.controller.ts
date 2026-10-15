import { Controller, Get, Param, Query } from '@nestjs/common';
import { AcademyService } from './academy.service.js';

@Controller('academy')
export class AcademyController {
  constructor(private readonly academyService: AcademyService) {}

  @Get()
  getIndex() {
    return { data: this.academyService.getIndex() };
  }

  @Get('search')
  search(@Query('q') q?: string) {
    return { data: this.academyService.search(q ?? '') };
  }

  @Get(':slug')
  getArticle(@Param('slug') slug: string) {
    return { data: this.academyService.getArticle(slug) };
  }
}
