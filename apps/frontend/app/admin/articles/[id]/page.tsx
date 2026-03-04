import ArticleEditorClient from "./ArticleEditorClient";

export default async function AdminArticleEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <ArticleEditorClient id={id} />;
}
