// import { createClient } from '@/lib/supabase/server';
// import { getTableOfContents } from 'fumadocs-core/server';
// import { z } from 'zod';

// const frontmatterSchema = z.object({
//   title: z.string(),
//   description: z.string().optional(),
// });

// // Helper function to recursively list all MDX files
// async function listAllMdxFiles(
//   supabase: Awaited<ReturnType<typeof createClient>>,
//   path: string
// ): Promise<{ name: string; path: string }[]> {
//   const { data: files, error } = await supabase.storage.from('files').list(path);
//   if (error) {
//     console.error(`Error listing files in path "${path}":`, error);
//     return [];
//   }

//   let mdxFiles: { name: string; path: string }[] = [];
//   for (const file of files) {
//     const newPath = path ? `${path}/${file.name}` : file.name;
//     if (file.id === null) {
//       // It's a folder
//       mdxFiles = mdxFiles.concat(await listAllMdxFiles(supabase, newPath));
//     } else if (file.name.endsWith('.mdx')) {
//       mdxFiles.push({ name: file.name, path: newPath });
//     }
//   }
//   return mdxFiles;
// }

// async function getPages() {
//   const supabase = await createClient();
//   const mdxFiles = await listAllMdxFiles(supabase, 'mdx');

//   if (!mdxFiles.length) {
//     console.error('No MDX files found in Supabase storage under mdx/');
//     return {
//       name: 'Docs',
//       children: [],
//     };
//   }

//   return {
//     name: 'Docs',
//     children: mdxFiles.map((file) => ({
//       type: 'page' as const,
//       name: file.name.replace('.mdx', ''),
//       url: `/docs/${file.path.replace(/^mdx\//, '').replace('.mdx', '')}`,
//     })),
//   };
// }

// async function getPage(slugs: string[]) {
//   const supabase = await createClient();
//   // Handle root page, assume it's index.mdx
//   const path = slugs.length > 0 ? slugs.join('/') : 'index';
//   const filePath = `mdx/${path}.mdx`;

//   const { data, error } = await supabase.storage
//     .from('files')
//     .download(filePath);

//   if (error || !data) {
//     console.error(`Error fetching file ${filePath} from Supabase:`, error);
//     return null;
//   }

//   const fileContent = await data.text();

//   // Simple frontmatter parsing (can be replaced with gray-matter)
//   const match = fileContent.match(/^---\n([\s\S]+?)\n---/);
//   const frontmatter: { [key: string]: string } = {};
//   let content = fileContent;

//   if (match) {
//     const frontmatterString = match[1];
//     content = fileContent.slice(match[0].length);
//     frontmatterString.split('\n').forEach((line) => {
//       const [key, ...valueParts] = line.split(':');
//       if (key && valueParts.length > 0) {
//         frontmatter[key.trim()] = valueParts.join(':').trim();
//       }
//     });
//   }

//   const toc = await getTableOfContents(content);

//   return {
//     frontmatter,
//     content,
//     toc,
//   };
// }

// export const supabaseSource = {
//   getPages,
//   getPage,
// };