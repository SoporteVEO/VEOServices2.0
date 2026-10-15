import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  DigitalCampaignArt,
  OfferStatus,
  ProductionOrderStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { fullName } from './crm.constants.js';
import { isoDay } from './crm-ooh.constants.js';

export interface CrmExecutionStaticItem {
  id: string;
  offerNumber: string;
  billboardCode: string | null;
  address: string | null;
  cityName: string | null;
  status: ProductionOrderStatus;
  hasDesign: boolean;
  scheduledInstallationAt: string | null;
  installedAt: string | null;
  installerName: string | null;
  proofCount: number;
}

export interface CrmExecutionDigitalItem {
  id: string;
  offerNumber: string;
  screenName: string;
  startDate: string | null;
  endDate: string | null;
  spotsPerDay: number;
  art: DigitalCampaignArt;
  paused: boolean;
  pauseReason: string | null;
  isLive: boolean;
}

export interface CrmDealExecution {
  offers: {
    id: string;
    offerNumber: string;
    status: OfferStatus;
    productionOrderNumber: string | null;
  }[];
  staticItems: CrmExecutionStaticItem[];
  digitalItems: CrmExecutionDigitalItem[];
  summary: {
    staticTotal: number;
    installed: number;
    pendingInstall: number;
    missingProof: number;
    digitalTotal: number;
    live: number;
    artPending: number;
  };
}

@Injectable()
export class CrmDealExecutionService {
  constructor(private readonly prisma: PrismaService) {}

  async get(dealId: string): Promise<CrmDealExecution> {
    const deal = await this.prisma.crmDeal.findUnique({
      where: { id: dealId },
      select: {
        offers: {
          select: {
            offer: {
              select: {
                id: true,
                offerNumber: true,
                status: true,
                productionOrder: {
                  select: {
                    orderNumber: true,
                    items: {
                      select: {
                        id: true,
                        billboardCode: true,
                        address: true,
                        cityName: true,
                        status: true,
                        designDocumentS3Key: true,
                        scheduledInstallationAt: true,
                        installedAt: true,
                        assignedInstaller: {
                          select: { firstName: true, lastName: true },
                        },
                        _count: { select: { installationImages: true } },
                      },
                    },
                  },
                },
                items: {
                  where: { itemType: 'DIGITAL_BILLBOARD' },
                  select: {
                    digitalCampaigns: {
                      select: {
                        id: true,
                        startDate: true,
                        endDate: true,
                        spotsPerDay: true,
                        art: true,
                        paused: true,
                        pauseReason: true,
                        sublist: {
                          select: {
                            name: true,
                            digitalBillboard: { select: { name: true } },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!deal) throw new NotFoundException('Negocio no encontrado');

    const today = isoDay(new Date())!;
    const offers = deal.offers.map((link) => link.offer);
    const staticItems: CrmExecutionStaticItem[] = offers.flatMap((offer) =>
      (offer.productionOrder?.items ?? []).map((item) => ({
        id: item.id,
        offerNumber: offer.offerNumber,
        billboardCode: item.billboardCode,
        address: item.address,
        cityName: item.cityName,
        status: item.status,
        hasDesign: !!item.designDocumentS3Key,
        scheduledInstallationAt:
          item.scheduledInstallationAt?.toISOString() ?? null,
        installedAt: item.installedAt?.toISOString() ?? null,
        installerName: item.assignedInstaller
          ? fullName(item.assignedInstaller)
          : null,
        proofCount: item._count.installationImages,
      })),
    );
    const digitalItems: CrmExecutionDigitalItem[] = offers.flatMap((offer) =>
      offer.items.flatMap((item) =>
        item.digitalCampaigns.map((campaign) => {
          const start = isoDay(campaign.startDate);
          const end = isoDay(campaign.endDate);
          return {
            id: campaign.id,
            offerNumber: offer.offerNumber,
            screenName: `${campaign.sublist.digitalBillboard.name} · ${campaign.sublist.name}`,
            startDate: start,
            endDate: end,
            spotsPerDay: campaign.spotsPerDay,
            art: campaign.art,
            paused: campaign.paused,
            pauseReason: campaign.pauseReason,
            isLive:
              !campaign.paused &&
              (!start || start <= today) &&
              (!end || end >= today),
          };
        }),
      ),
    );

    const active = staticItems.filter((i) => i.status !== 'CANCELLED');
    return {
      offers: offers.map((offer) => ({
        id: offer.id,
        offerNumber: offer.offerNumber,
        status: offer.status,
        productionOrderNumber: offer.productionOrder?.orderNumber ?? null,
      })),
      staticItems,
      digitalItems,
      summary: {
        staticTotal: active.length,
        installed: active.filter((i) => i.installedAt).length,
        pendingInstall: active.filter((i) => !i.installedAt).length,
        missingProof: active.filter((i) => i.installedAt && i.proofCount === 0)
          .length,
        digitalTotal: digitalItems.length,
        live: digitalItems.filter((i) => i.isLive).length,
        artPending: digitalItems.filter((i) => i.art !== 'RECEIVED').length,
      },
    };
  }
}
