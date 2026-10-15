import { Document } from "@react-pdf/renderer";
import { registerDocumentFonts } from "@/lib/pdf-document-fonts";
import {
  ContractReportBenefitsPage,
  ContractReportClosingPage,
  ContractReportExperiencePage,
  ContractReportFormatsPage,
} from "@/components/pages/reports/pdf/contract-report-about-pages";
import { AvailabilityReportBillboardPage } from "./availability-report-billboard-page";
import { AvailabilityReportCoverPage } from "./availability-report-cover-page";
import {
  buildAvailabilityCopy,
  paginateAvailabilityIndex,
  type AvailabilityReportPdfData,
} from "./availability-report-data";
import {
  AvailabilityReportIndexPage,
  AvailabilityReportSummaryPage,
} from "./availability-report-summary-pages";

registerDocumentFonts();

const EXPERIENCE_PAGE = 2;
const FORMATS_PAGE = 3;
const SUMMARY_PAGE = 4;

export function AvailabilityReportPdfDocument({ data }: { data: AvailabilityReportPdfData }) {
  const copy = buildAvailabilityCopy(data);
  const indexPageCount = paginateAvailabilityIndex(data.billboards, copy, 0).length;
  const firstBillboardPage = SUMMARY_PAGE + indexPageCount;
  const [summaryRows = [], ...continuationRows] = paginateAvailabilityIndex(
    data.billboards,
    copy,
    firstBillboardPage,
  );
  const benefitsPage = firstBillboardPage + data.billboards.length;
  const coverPhoto = data.billboards.find((b) => b.image)?.image ?? null;

  return (
    <Document
      title={`Disponibilidad de vallas · ${copy.coverDate}`}
      author="VEO"
      subject="Disponibilidad de vallas"
      creator="VEO Services"
    >
      <AvailabilityReportCoverPage copy={copy} photo={coverPhoto} />
      <ContractReportExperiencePage footerLabel={copy.footerLabel} pageNumber={EXPERIENCE_PAGE} />
      <ContractReportFormatsPage footerLabel={copy.footerLabel} pageNumber={FORMATS_PAGE} />
      <AvailabilityReportSummaryPage copy={copy} rows={summaryRows} pageNumber={SUMMARY_PAGE} />
      {continuationRows.map((rows, index) => (
        <AvailabilityReportIndexPage
          key={index}
          copy={copy}
          rows={rows}
          pageNumber={SUMMARY_PAGE + 1 + index}
        />
      ))}
      {data.billboards.map((billboard, index) => (
        <AvailabilityReportBillboardPage
          key={`${billboard.code}-${index}`}
          billboard={billboard}
          copy={copy}
          position={index + 1}
          total={data.billboards.length}
          pageNumber={firstBillboardPage + index}
        />
      ))}
      <ContractReportBenefitsPage
        footerLabel={copy.footerLabel}
        pageNumber={benefitsPage}
        eyebrow="Beneficios que le ofrecemos"
      />
      <ContractReportClosingPage
        tagline="Crecemos con su marca. Visible. Verificable. VEO."
        taglineMaxChars={14}
      />
    </Document>
  );
}
