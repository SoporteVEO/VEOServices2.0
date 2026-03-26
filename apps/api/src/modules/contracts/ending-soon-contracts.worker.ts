import { NotificationStatus } from '@prisma/client';
import type { ContractsService } from './contracts.service.js';
import type { EmailService } from '../email/email.service.js';

const RATE_LIMIT_MS = 1000;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class EndingSoonContractsWorker {
  constructor(
    private readonly contractsService: ContractsService,
    private readonly emailService?: EmailService,
  ) {}

  async execute() {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 15);

    const contracts =
      await this.contractsService.getEndingSoonContractsFiltered(
        startDate,
        endDate,
      );

    console.log(`Found ${contracts.length} contracts to send email`);

    for (const contract of contracts) {
      try {
        if (this.emailService) {
          await this.emailService.sendEmail(
            contract.customerEmail,
            'Contrato por vencer',
            `Estimado/a ${contract.customerName}, su contrato ${contract.contractNumber} está por vencer.`,
          );
        }

        await this.contractsService.createNotifiedContract({
          contractSourceId: contract.contractSourceId,
          contractDetailSourceId: contract.contractDetailSourceId,
          contractNumber: contract.contractNumber,
          status: NotificationStatus.SENT,
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.error(
          `Error sending email to ${contract.customerEmail}: ${errorMessage}`,
        );

        await this.contractsService.createNotifiedContract({
          contractSourceId: contract.contractSourceId,
          contractDetailSourceId: contract.contractDetailSourceId,
          contractNumber: contract.contractNumber,
          status: NotificationStatus.FAILED,
          errorMessage,
        });
      }

      await sleep(RATE_LIMIT_MS);
    }
  }
}
