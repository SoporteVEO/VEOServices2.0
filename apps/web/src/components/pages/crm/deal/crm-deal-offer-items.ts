import type { CrmDealSite } from "@/api/crm/crm-ooh.types";
import {
  calculateImpressionPrice,
  calculateStaticRentalPrice,
  IVA_RATE,
  type StaticOfferItem,
} from "@/components/pages/my-space/quotation/offer-types";

/** `YYYY-MM-DD` as a local date, so the offer shows the same calendar day. */
function localDate(value: string): Date {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  return new Date(year!, month! - 1, day);
}

export function dealSitesToStaticOfferItems(sites: CrmDealSite[]): StaticOfferItem[] {
  return sites
    .filter(
      (site): site is CrmDealSite & { billboardId: number } =>
        site.kind === "STATIC" && site.status !== "RELEASED" && site.billboardId !== null,
    )
    .map((site) => {
      const startDate = localDate(site.startDate);
      const endDate = localDate(site.endDate);
      const location = [site.cityName, site.departmentName].filter(Boolean).join(", ");
      const impressionPrice = calculateImpressionPrice(site.width, site.height);
      return {
        id: `static-${site.billboardId}`,
        type: "STATIC_BILLBOARD",
        billboardId: site.billboardId,
        billboardCode: site.code,
        description: [site.label, location].filter(Boolean).join(" · ") || "—",
        cityName: site.cityName,
        departmentName: site.departmentName,
        width: site.width,
        height: site.height,
        quantity: 1,
        impressionPrice,
        monthlyRentalPrice: site.rate,
        rentalPrice: calculateStaticRentalPrice(site.rate, startDate, endDate),
        listMonthlyRentalPrice: site.rate,
        listImpressionPrice: impressionPrice,
        taxRate: IVA_RATE,
        startDate,
        endDate,
      };
    });
}
