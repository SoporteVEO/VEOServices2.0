import { Document } from "@react-pdf/renderer";
import { registerDocumentFonts } from "@/lib/pdf-document-fonts";
import {
  ContractReportBenefitsPage,
  ContractReportClosingPage,
  ContractReportExperiencePage,
  ContractReportFormatsPage,
} from "./contract-report-about-pages";
import { ContractReportBillboardPage } from "./contract-report-billboard-page";
import { ContractReportCoverPage } from "./contract-report-cover-page";
import {
  countIndexPages,
  paginateIndex,
  type ContractReportPdfData,
} from "./contract-report-pdf-data";
import {
  ContractReportIndexPage,
  ContractReportSummaryPage,
} from "./contract-report-summary-pages";

registerDocumentFonts();

const SUMMARY_PAGE = 2;

export function ContractReportPdfDocument({
  data,
  showSeal = true,
}: {
  data: ContractReportPdfData;
  showSeal?: boolean;
}) {
  const firstIndexPage = SUMMARY_PAGE + 1;
  const firstBillboardPage = firstIndexPage + countIndexPages(data.billboards);
  const indexPages = paginateIndex(data.billboards, firstBillboardPage);
  const firstAboutPage = firstBillboardPage + data.billboards.length;

  return (
    <Document
      title={`Reporte de vallas · ${data.contractNumber} · ${data.period}`}
      author="VEO"
      subject={`Reporte de vallas del contrato ${data.contractNumber}`}
      creator="VEO Services"
    >
      <ContractReportCoverPage data={data} />
      <ContractReportSummaryPage data={data} pageNumber={SUMMARY_PAGE} showSeal={showSeal} />
      {indexPages.map((rows, index) => (
        <ContractReportIndexPage
          key={index}
          data={data}
          rows={rows}
          pageNumber={firstIndexPage + index}
        />
      ))}
      {data.billboards.map((billboard, index) => (
        <ContractReportBillboardPage
          key={`${billboard.code}-${index}`}
          billboard={billboard}
          position={index + 1}
          total={data.billboards.length}
          contractNumber={data.contractNumber}
          pageNumber={firstBillboardPage + index}
        />
      ))}
      <ContractReportExperiencePage
        footerLabel={data.contractNumber}
        pageNumber={firstAboutPage}
      />
      <ContractReportFormatsPage
        footerLabel={data.contractNumber}
        pageNumber={firstAboutPage + 1}
      />
      <ContractReportBenefitsPage
        footerLabel={data.contractNumber}
        pageNumber={firstAboutPage + 2}
      />
      <ContractReportClosingPage />
    </Document>
  );
}
