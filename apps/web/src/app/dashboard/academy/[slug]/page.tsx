import { AcademyArticlePage } from "@/components/pages/academy/academy-article-page";

export default async function AcademyArticleRoutePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <AcademyArticlePage slug={slug} />;
}
