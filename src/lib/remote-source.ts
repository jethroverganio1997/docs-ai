import matter from "gray-matter";
import { PageTree } from "fumadocs-core/server";
import { createClient } from "./supabase/server";

// Name of your Supabase Storage bucket
const BUCKET_NAME = "files";

export interface Frontmatter {
    title: string;
    description?: string;
}

interface Page {
    slug: string[];
    path: string;
}

interface Document {
    id: number;
    name: string;
    storage_object_path: string | null;
}

/**
 * Helper function to recursively list all files in a Supabase Storage bucket.
 * @param path - The current path to list files from.
 * @returns A promise that resolves to an array of file objects.
 */
async function listAllStoragePaths(): Promise<Document[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("documents_with_storage_path")
        .select();

    if (error) {
        console.error(`Error fetching file's path`, error.message);
        return [];
    }
    return data as Document[];
}

/**
 * Fetches a single page from the Supabase Storage bucket.
 *
 * @param {string[]} slugs - The slug array identifying the page.
 * @returns {Promise<{ frontmatter: Frontmatter; content: string } | undefined>}
 */
export async function getPage(
    slugs: string[] = [],
): Promise<
    { frontmatter: Frontmatter; content: string; filePath: string } | undefined
> {
    const supabase = await createClient();
    const filePath = slugs.join("/") + ".mdx";

    try {
        const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .download(filePath);

        if (error) {
            // If the direct path fails, try fetching an index file (e.g., /docs -> /docs/index.mdx)
            const indexPath = slugs.length > 0
                ? slugs.join("/") + "/index.mdx"
                : "index.mdx";
            const { data: indexData, error: indexError } = await supabase
                .storage
                .from(BUCKET_NAME)
                .download(indexPath);

            if (indexError) {
                console.error(
                    `Page not found at "${filePath}" or "${indexPath}"`,
                );
                return undefined;
            }

            const rawContent = await indexData.text();
            const { data: frontmatter, content } = matter(rawContent);
            return {
                frontmatter: frontmatter as Frontmatter,
                content,
                filePath,
            };
        }

        const rawContent = await data.text();
        const { data: frontmatter, content } = matter(rawContent);

        return { frontmatter: frontmatter as Frontmatter, content, filePath };
    } catch (err) {
        console.error("An unexpected error occurred:", err);
        return undefined;
    }
}

/**
 * Fetches a list of all .mdx files from the Supabase Storage bucket.
 *
 * @returns {Promise<Page[]>}
 */
export async function getPages(): Promise<Page[]> {
    // Use the new recursive helper function
    const allFiles = await listAllStoragePaths();

    // Filter for .mdx files and map them to the required structure
    return allFiles
        .filter((file) => file.name.endsWith(".mdx"))
        .map((file) => {
            // Remove the .mdx extension
            const pathWithoutExt = file.name.slice(0, -4);
            const slugs = pathWithoutExt.split("/");

            // If the last part of the slug is 'index', remove it for a cleaner URL
            if (slugs[slugs.length - 1] === "index") {
                slugs.pop();
            }

            return {
                path: file.name,
                slug: slugs,
            };
        });
}

/**
 * Generates a PageTree by fetching file paths and content from Supabase Storage.
 * @param bucketName The name of your Supabase Storage bucket.
 * @returns The generated page tree.
 */
export async function getPageTree(): Promise<PageTree.Root> {
    const documents = await listAllStoragePaths();

    const root: PageTree.Root = {
        name: "Docs",
        children: [],
    };

    for (const doc of documents) {
        const fullPath = doc.storage_object_path;

        if (!fullPath || !fullPath.endsWith(".mdx")) {
            continue;
        }

        const parts = fullPath.split("/");
        const fileName = parts[parts.length - 1];
        const dirParts = parts.slice(0, -1);

        let currentNode: PageTree.Folder | PageTree.Root = root;

        // This loop correctly finds or creates parent folders
        for (const part of dirParts) {
            let folderNode: PageTree.Folder | undefined = currentNode.children
                .find(
                    (node): node is PageTree.Folder =>
                        node.type === "folder" && node.name === part,
                );

            if (!folderNode) {
                folderNode = {
                    type: "folder",
                    name: part,
                    children: [],
                };
                currentNode.children.push(folderNode);
            }
            currentNode = folderNode;
        }

        const url = "/" + fullPath.replace(/\.mdx?$/, "");
        const pageNode: PageTree.Item = {
            type: "page",
            name: fileName.replace(/\.mdx?$/, ""),
            url,
            external: false,
        };

        const isFolder = "type" in currentNode && currentNode.type === "folder";

        if (fileName === "index.mdx" && isFolder) {
            (currentNode as PageTree.Folder).index = pageNode;
        } else {
            currentNode.children.push(pageNode);
        }
    }

    return root;
}
