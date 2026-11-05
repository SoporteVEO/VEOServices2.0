import {
  Controller,
  Get,
  Headers,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { timingSafeEqual } from 'node:crypto';
import { Public } from '../auth/decorators.js';
import { MentorshipSweepService } from './mentorship-sweep.service.js';

function matchesSecret(header: string | undefined, secret: string): boolean {
  const expected = Buffer.from(`Bearer ${secret}`);
  const received = Buffer.from(header ?? '');
  return (
    expected.length === received.length && timingSafeEqual(expected, received)
  );
}

/**
 * Daily trigger called by Supabase pg_cron (`apps/api/supabase/mentorships-cron.sql`),
 * which authenticates with `CRON_SECRET`.
 */
@Public()
@Controller('mentorships/cron')
export class MentorshipsCronController {
  constructor(private readonly sweep: MentorshipSweepService) {}

  @Get('sweep')
  async run(@Headers('authorization') authorization?: string) {
    const secret = process.env.CRON_SECRET;
    if (!secret) {
      throw new ServiceUnavailableException('CRON_SECRET no está configurado');
    }
    if (!matchesSecret(authorization, secret)) {
      throw new UnauthorizedException();
    }
    return { data: await this.sweep.run() };
  }
}
