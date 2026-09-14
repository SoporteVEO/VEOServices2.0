import { pdf } from "@react-pdf/renderer";
import { getOfferContractData } from "@/api/offers/offers.get";
import { attachOfferContractPdf } from "@/api/offers/offers.patch";
import {
  blobToBase64,
  downloadBlob,
  safeFileName,
} from "@/lib/pdf-download";
import { ContractPdfDocument } from "./contract-pdf-document";

/**
 * Renders the lease contract for an accepted offer, hands it to the browser and
 * archives a copy in S3.
 *
 * The archive step runs after the download and never rethrows: the user already
 * has the file they asked for, so a storage hiccup must not surface as a failed
 * download.
 */
export async function downloadOfferContract(
  offerId: string,
  options: { viewAsUserId?: string | null } = {},
): Promise<void> {
  const data = await getOfferContractData(offerId, options);
  const blob = await pdf(<ContractPdfDocument data={data} />).toBlob();

  downloadBlob(blob, safeFileName(`Contrato ${data.contractNumber}.pdf`));

  try {
    await attachOfferContractPdf(offerId, await blobToBase64(blob));
  } catch (error) {
    console.error("No se pudo archivar el contrato en S3:", error);
  }
}
