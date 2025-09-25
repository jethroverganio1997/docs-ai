// import { supabase } from './lib/supabase';
// import type { Source, VirtualFile } from 'fumadocs-core/source';
// import { compileMDX } from '@fumadocs/mdx-remote';
// import remarkGfm from 'remark-gfm';
// import rehypeSlug from 'rehype-slug';
// import type { ReactElement } from 'react';
// import type { FileObject } from '@supabase/supabase-js'; // [!code ++]

// const BUCKET_NAME = 'your-bucket-name';
// const DOCS_PREFIX = 'docs/';

// /**
//  * An async function to fetch, download, and compile all MDX files.
//  */
// async function getSupabaseFiles(): Promise<VirtualFile[]> {
//   const { data: fileList, error: listError } = await supabase.storage
//     .from(BUCKET_NAME)
//     .list(DOCS_PREFIX, {
//       search: '.mdx',
//     });

//   if (listError) throw new Error(`Failed to list Supabase files: ${listError.message}`);
//   if (!fileList) return [];

//   const filePromises = fileList.map(async (file: FileObject): Promise<VirtualFile | null> => { // [!code ++]
//     const filePath = `${DOCS_PREFIX}${file.name}`;
//     try {
//       const { data: blob, error: downloadError } = await supabase.storage
//         .from(BUCKET_NAME)
//         .download(filePath);

//       if (downloadError) throw downloadError;

//       const rawContent = await blob.text();

//       const compiled = await compileMDX({
//         source: rawContent,
//         mdxOptions: {
//           remarkPlugins: [remarkGfm],
//           rehypePlugins: [rehypeSlug],
//         },
//       });

//       return {
//         path: file.name,
//         type: 'page',
//         data: { ...compiled.frontmatter, body: compiled.body, toc: compiled.toc },
//       };
//     } catch (error) {
//       console.error(`Failed to process file ${filePath}:`, error);
//       return null;
//     }
//   });

//   const settledFiles = await Promise.all(filePromises);

//   return settledFiles.filter((file:FileObject): file is VirtualFile => file !== null);
// }

// const supabaseFiles = await getSupabaseFiles();

// export const supabaseSource: Source<{
//   pageData: {
//     title: string;
//     description?: string;
//     body: ReactElement;
//     toc: any[];
//   };
//   metaData: {};
// }> = {
//   files: supabaseFiles,
// };