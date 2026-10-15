import { Document } from "@react-pdf/renderer";
import { registerDocumentFonts } from "@/lib/pdf-document-fonts";
import {
  ContractReportBenefitsPage,
  ContractReportClosingPage,
  ContractReportExperiencePage,
  ContractReportFormatsPage,
} from "../contract-report-about-pages";
import { ClientProposalBillboardPage } from "./client-proposal-billboard-page";
import {
  ClientProposalContextPage,
  ClientProposalStrategyPage,
} from "./client-proposal-brief-pages";
import { ClientProposalCoverPage } from "./client-proposal-cover-page";
import { ClientProposalInvestmentPage } from "./client-proposal-investment-page";
import {
  chunkInvestmentRows,
  type ClientProposalPdfData,
} from "./client-proposal-pdf-data";

registerDocumentFonts();

const CONTEXT_PAGE = 2;
const STRATEGY_PAGE = 3;
const FIRST_INVESTMENT_PAGE = 4;

export function ClientProposalPdfDocument({ data }: { data: ClientProposalPdfData }) {
  const investmentPageCount = chunkInvestmentRows(data.billboards).length;
  const firstBillboardPage = FIRST_INVESTMENT_PAGE + investmentPageCount;
  const investmentPages = chunkInvestmentRows(
    data.billboards.map((billboard, index) => ({
      billboard,
      pageNumber: firstBillboardPage + index,
    })),
  );
  const firstAboutPage = firstBillboardPage + data.billboards.length;

  return (
    <Document
      title={`Propuesta VEO · ${data.company} · ${data.period}`}
      author="VEO"
      subject={`Propuesta de vallas para ${data.company}`}
      creator="VEO Services · Nexo"
    >
      <ClientProposalCoverPage data={data} />
      <ClientProposalContextPage data={data} pageNumber={CONTEXT_PAGE} />
      <ClientProposalStrategyPage data={data} pageNumber={STRATEGY_PAGE} />
      {investmentPages.map((rows, index) => (
        <ClientProposalInvestmentPage
          key={index}
          data={data}
          rows={rows}
          pageNumber={FIRST_INVESTMENT_PAGE + index}
          isLast={index === investmentPages.length - 1}
        />
      ))}
      {data.billboards.map((billboard, index) => (
        <ClientProposalBillboardPage
          key={`${billboard.code}-${index}`}
          billboard={billboard}
          position={index + 1}
          total={data.billboards.length}
          company={data.company}
          pageNumber={firstBillboardPage + index}
        />
      ))}
      <ContractReportExperiencePage footerLabel={data.company} pageNumber={firstAboutPage} />
      <ContractReportFormatsPage footerLabel={data.company} pageNumber={firstAboutPage + 1} />
      <ContractReportBenefitsPage
        footerLabel={data.company}
        pageNumber={firstAboutPage + 2}
        eyebrow="Incluido"
      />
      <ContractReportClosingPage />
    </Document>
  );
}
