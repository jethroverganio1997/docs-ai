// import { source } from "@/lib/source";
import type { Metadata } from "next";
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from "fumadocs-ui/page";
import { notFound } from "next/navigation";
import { createCompiler, parseFrontmatter } from "@fumadocs/mdx-remote";
import { Frontmatter, getPage } from "../../../lib/remote-source";
import { getMDXComponents } from "@/components/fuma/mdx-components";
import { cache } from "react";
import { remarkStructure } from "fumadocs-core/mdx-plugins";
import Link from "next/link";

const compiler = createCompiler({
  remarkPlugins: [remarkStructure],
});

const getCachePage = cache(async (slug: string[] | undefined) => {
  return {
    page: await getPage(slug),
    cachedAt: new Date().toISOString(),
  };
});

export default async function Page(props: PageProps<"/docs/[[...slug]]">) {
  const params = await props.params;
  const cache = await getCachePage(params.slug);
  if (!cache) notFound();

  const compiled = await compiler.compile<Frontmatter>({
    filePath: cache.page.directPath,
    source: cache.page.content,
  });

  const MdxContent = compiled.body;

  return (
    <DocsPage toc={compiled.toc}>
      <Link href={cache.page.url}>{JSON.stringify(cache.page.url)}</Link>
      <p>{JSON.stringify(cache.cachedAt)}</p>
      <p>{JSON.stringify(compiled.vfile.data.structuredData)}</p>
      <DocsTitle>{compiled.frontmatter.title}</DocsTitle>
      <DocsDescription>{compiled.frontmatter.description}</DocsDescription>
      <DocsBody>
        <MdxContent components={getMDXComponents()} />
      </DocsBody>
    </DocsPage>
  );
}

export async function generateMetadata(props: {
  params: Promise<{ slug?: string[] }>;
}) {
  const params = await props.params;
  const cache = await getCachePage(params.slug);
  if (!cache) notFound();

  const { frontmatter } = parseFrontmatter(cache.page.content);

  return {
    title: frontmatter.title,
    description: frontmatter.description,
  } satisfies Metadata;
}

// export async function generateStaticParams() {
//   return (await getPages()).map((page) => ({ slug: page.slug }));
// }
