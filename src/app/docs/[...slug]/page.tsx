import type { Metadata } from "next";
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from "fumadocs-ui/page";
import { notFound } from "next/navigation";
import { createCompiler, parseFrontmatter } from "@fumadocs/mdx-remote";
import { getPage } from "@/lib/remote-source";
import { getMDXComponents } from "@/components/mdx/mdx-components";
import { cache } from "react";
import { rehypeCode, remarkStructure } from "fumadocs-core/mdx-plugins";

const compiler = createCompiler({
  remarkPlugins: [remarkStructure],
  rehypePlugins: [rehypeCode],
});

const getCachePage = cache(async (slug: string[] | undefined) => {
  return await getPage(slug);
});

export default async function Page(props: PageProps<"/docs/[...slug]">) {
  const params = await props.params;
  const cache = await getPage(params.slug);
  if (!cache) notFound();

  const compiled = await compiler.compile({
    filePath: cache.directPath,
    source: cache.content,
  });

  const MdxContent = compiled.body;

  return (
    <DocsPage toc={compiled.toc}>
      <DocsTitle>{cache.frontmatter.title}</DocsTitle>
      <DocsDescription>{cache.frontmatter.description}</DocsDescription>
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

  const { frontmatter } = parseFrontmatter(cache.content);

  return {
    title: frontmatter.title,
    description: frontmatter.description,
  } satisfies Metadata;
}
