import { readFile } from "fs/promises";
import path from "path";
import { marked } from "marked";
import { PageHero } from "@/components/site/page-hero";

export async function LegalPage({ file, title, updated }: { file: string; title: string; updated: string }) {
  const md = await readFile(path.join(process.cwd(), "src", "content", file), "utf8");
  const html = marked.parse(md, { async: false }) as string;
  return (
    <>
      <PageHero title={title} lead={`Last updated: ${updated}`} crumbs={[{ label: title }]} />
      <div className="container-page max-w-3xl py-12">
        <div className="prose-found" dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </>
  );
}
