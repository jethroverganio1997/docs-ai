import {
  DocsDescription,
  DocsPage,
  DocsTitle,
  DocsBody,
} from "fumadocs-ui/page";
// import { DocsBody } from "../_components/docs-page";
import { notFound } from "next/navigation";
import { getPage } from "@/app/docs/_lib/actions";
import { getMDXComponents } from "@/components/mdx/mdx-components";
import { cookies } from "next/headers";
import { unstable_cache as cacheTag } from "next/cache";
import { DOCS_PAGE_KEY, DOCS_PAGE_TAG } from "../_lib/constants";
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

export default async function Page(props: PageProps<"/docs/[...slug]">) {
  const params = await props.params;
  const cookieStore = cookies();

  const getDocument = cacheTag(
    async () => {
      return await getPage(params.slug!, cookieStore);
    },
    [DOCS_PAGE_KEY, ...params.slug],
    {
      tags: [DOCS_PAGE_TAG, ...params.slug],
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
