import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend = new Resend(process.env.RESEND_API_KEY);
  private readonly fromEmail =
    process.env.RESEND_FROM_EMAIL ?? 'soporte.dev@arhedes.com.sv';
  private readonly testToEmail =
    process.env.RESEND_TEST_TO_EMAIL ?? 'soporte.dev@arhedes.com.sv';

  async sendEmail(to: string, subject: string, htmlContent: string) {
    const isProd = process.env.NODE_ENV === 'production';

    const { data, error } = await this.resend.emails.send({
      from: `VEO <${this.fromEmail}>`,
      to: [isProd ? to : this.testToEmail],
      subject,
      html: htmlContent,
    });

    if (error) {
      this.logger.error(`Failed to send email to ${to}: ${error.message}`);
    }

    return { data, error };
  }
}
