import {
  DocsDescription,
  DocsPage,
  DocsTitle,
  DocsBody,
} from "fumadocs-ui/page";
import { notFound } from "next/navigation";
import { getPage } from "@/features/docs/server-api";
import { getMDXComponents } from "@/components/mdx/mdx-components";
import { unstable_cache as cacheTag } from "next/cache";
import { DOCS_PAGE_KEY, DOCS_PAGE_TAG } from "@/features/docs/constants";
import { remarkMdxFiles, remarkStructure } from "fumadocs-core/mdx-plugins";
import { createCompiler } from "@fumadocs/mdx-remote";

const compiler = createCompiler({
  remarkPlugins: [remarkStructure, remarkMdxFiles],
  rehypeCodeOptions: {
    themes: {
      light: "slack-ochin",
      dark: "catppuccin-mocha",
    },
  },
});

type DocsPageProps = {
  params: Promise<{
    slug?: string[];
  }>;
};

export default async function Page(props: DocsPageProps) {
  const params = await props.params;
  const slug = params.slug ?? [];

  const getDocument = cacheTag(
    async () => {
      return await getPage(slug);
    },
    [DOCS_PAGE_KEY, ...slug],
    {
      tags: [DOCS_PAGE_TAG, ...slug],
      revalidate: 60 * 60 * 24, // 24 hours (in seconds)
    }
  );

  const document = await getDocument();
  if (!document) notFound();

  const compiled = await compiler.compile({
    filePath: document.directPath,
    source: document.content,
  });

  const MdxContent = compiled.body;

  return (
    <DocsPage
      article={{
        style: {
          backgroundColor: "var(--color-fd-background)",
          boxShadow: "none",
          border: "none",
        },
      }}
      toc={compiled.toc}
    >
      <DocsTitle>{document.frontmatter.title}</DocsTitle>
      <DocsDescription>{document.frontmatter.description}</DocsDescription>
      <DocsBody>
        <MdxContent components={getMDXComponents()} />
      </DocsBody>
    </DocsPage>
  );
}
