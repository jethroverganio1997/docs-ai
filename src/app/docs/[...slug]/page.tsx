import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from "fumadocs-ui/page";
import { notFound } from "next/navigation";
import { getPage } from "@/app/docs/_lib/actions";
import { getMDXComponents } from "@/components/mdx/mdx-components";
import { cookies } from "next/headers";
import { unstable_cache as cacheTag } from "next/cache";
import { DOCS_PAGE_KEY, DOCS_PAGE_TAG } from "../_lib/constants";
import { remarkStructure } from "fumadocs-core/mdx-plugins";
import { createCompiler } from "@fumadocs/mdx-remote";

const compiler = createCompiler({
  remarkPlugins: [remarkStructure],
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
    <DocsPage toc={compiled.toc}>
      <DocsTitle>{document.frontmatter.title}</DocsTitle>
      <DocsDescription>{document.frontmatter.description}</DocsDescription>
      <DocsBody>
        <MdxContent components={getMDXComponents()} />
      </DocsBody>
    </DocsPage>
  );
}
