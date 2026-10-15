import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import {
  buildAcademyArticle,
  buildAcademyIndex,
  findBrokenAcademyLinks,
} from './academy-content.js';
import { searchAcademy } from './academy-search.js';

@Injectable()
export class AcademyService implements OnModuleInit {
  private readonly logger = new Logger(AcademyService.name);

  onModuleInit() {
    const broken = findBrokenAcademyLinks();
    if (broken.length > 0) {
      this.logger.warn(`Enlaces rotos en VEO Academy:\n${broken.join('\n')}`);
    }
  }

  getIndex() {
    return buildAcademyIndex();
  }

  search(query: string) {
    return searchAcademy(query);
  }

  getArticle(slug: string) {
    const article = buildAcademyArticle(slug);
    if (!article) throw new NotFoundException('Artículo no encontrado');
    return article;
  }
}
