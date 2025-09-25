// // import { source } from "@/lib/source";
// import type { Metadata } from "next";
// import {
//   DocsBody,
//   DocsDescription,
//   DocsPage,
//   DocsTitle,
// } from "fumadocs-ui/page";
// import { notFound } from "next/navigation";
// import { compileMDX, parseFrontmatter } from "@fumadocs/mdx-remote";
// import { Frontmatter, getPage, getPages } from "../../../lib/remote-source";
// import { getMDXComponents } from "@/components/fuma/mdx-components";

// export default async function Page(props: PageProps<"/docs/[[...slug]]">) {
//   const params = await props.params;
//   const page = await getPage(params.slug);
//   if (!page) notFound();

//   const compiled = await compileMDX<Frontmatter>({
//     filePath: page.filePath,
//     source: page.content,
//   });
//   const MdxContent = compiled.body;

//   return (
//     <DocsPage toc={compiled.toc}>
//       <DocsTitle>{compiled.frontmatter.title}</DocsTitle>
//       <DocsDescription>{compiled.frontmatter.description}</DocsDescription>
//       <DocsBody>
//         <MdxContent components={getMDXComponents()} />
//       </DocsBody>
//     </DocsPage>
//   );
// }

// export async function generateStaticParams() {
//   return (await getPages()).map((page) => ({ slug: page.slug }));
// }

// export async function generateMetadata(props: {
//   params: Promise<{ slug?: string[] }>;
// }) {
//   const params = await props.params;
//   const page = await getPage(params.slug);
//   if (!page) notFound();

//   const { frontmatter } = parseFrontmatter(page.content);

//   return {
//     title: frontmatter.title,
//     description: frontmatter.description,
//   } satisfies Metadata;
// }
import React from "react";

function page() {
  return <div>page</div>;
}

export default page;
