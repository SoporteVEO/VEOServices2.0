import { Module } from '@nestjs/common';
import { BillboardsModule } from '../billboards/billboards.module.js';
import { DigitalBillboardsModule } from '../digital-billboards/digital-billboards.module.js';
import { CrmActivitiesController } from './controllers/crm-activities.controller.js';
import { CrmInventoryController } from './controllers/crm-inventory.controller.js';
import { CrmRenewalsController } from './controllers/crm-renewals.controller.js';
import { CrmDashboardOohService } from './crm-dashboard-ooh.service.js';
import { CrmDealExecutionService } from './crm-deal-execution.service.js';
import { CrmDealSitesService } from './crm-deal-sites.service.js';
import { CrmInventoryService } from './crm-inventory.service.js';
import { CrmRenewalsService } from './crm-renewals.service.js';
import { CrmConnectionsController } from './controllers/crm-connections.controller.js';
import { CrmContactsController } from './controllers/crm-contacts.controller.js';
import { CrmDealsController } from './controllers/crm-deals.controller.js';
import { CrmMessagesController } from './controllers/crm-messages.controller.js';
import { CrmOverviewController } from './controllers/crm-overview.controller.js';
import { CrmPipelinesController } from './controllers/crm-pipelines.controller.js';
import { CrmTasksController } from './controllers/crm-tasks.controller.js';
import { CrmTemplatesController } from './controllers/crm-templates.controller.js';
import { CrmWhatsAppWebhookController } from './controllers/crm-whatsapp-webhook.controller.js';
import { CrmActivitiesService } from './crm-activities.service.js';
import { CrmClientsService } from './crm-clients.service.js';
import { CrmConnectionsService } from './crm-connections.service.js';
import { CrmContactsService } from './crm-contacts.service.js';
import { CrmDashboardService } from './crm-dashboard.service.js';
import { CrmDealsService } from './crm-deals.service.js';
import { CrmMessagesService } from './crm-messages.service.js';
import { CrmPipelinesService } from './crm-pipelines.service.js';
import { CrmTasksService } from './crm-tasks.service.js';
import { CrmTemplatesService } from './crm-templates.service.js';
import { GmailClient } from './integrations/gmail.client.js';
import { WhatsAppClient } from './integrations/whatsapp.client.js';

@Module({
  imports: [BillboardsModule, DigitalBillboardsModule],
  controllers: [
    CrmOverviewController,
    CrmInventoryController,
    CrmRenewalsController,
    CrmPipelinesController,
    CrmDealsController,
    CrmContactsController,
    CrmActivitiesController,
    CrmTasksController,
    CrmTemplatesController,
    CrmMessagesController,
    CrmConnectionsController,
    CrmWhatsAppWebhookController,
  ],
  providers: [
    GmailClient,
    WhatsAppClient,
    CrmActivitiesService,
    CrmPipelinesService,
    CrmDealsService,
    CrmContactsService,
    CrmTasksService,
    CrmTemplatesService,
    CrmConnectionsService,
    CrmMessagesService,
    CrmDashboardService,
    CrmClientsService,
    CrmInventoryService,
    CrmDealSitesService,
    CrmDealExecutionService,
    CrmRenewalsService,
    CrmDashboardOohService,
  ],
})
export class CrmModule {}
