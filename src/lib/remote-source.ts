import matter from "gray-matter";
import { PageTree } from "fumadocs-core/server";
import { createClient } from "./supabase/server";
import { notFound } from "next/navigation";
import { DocumentView } from "../types/document-view";
import { Frontmatter } from "../types/frontmatter";

// Name of your Supabase Storage bucket
const BUCKET_NAME = "files";


// This is a helper function to get all file paths from your database view.
// You need a view or table that lists the paths of objects in your bucket.
async function listAllFilePaths(): Promise<DocumentView[]> {
    const supabase = await createClient();
    // Replace 'documents_with_storage_path' with the name of your view/table
    // and 'storage_object_path' with the column name containing the file path.
    const { data, error } = await supabase
        .from("documents_with_storage_path")
        .select();

    if (error) {
        console.error("Error fetching file paths:", error);
        return [];
    }

    // Filter out any null paths and return the list of strings
    return data as DocumentView[];
}

/**
 * Fetches a single page from the Supabase Storage bucket.
 *
 * @param {string[]} slugs - The slug array identifying the page.
 * @returns {Promise<{ frontmatter: Frontmatter; content: string } | undefined>}
 */

export async function getPage(slugs: string[] = []): Promise<{
    frontmatter: Frontmatter;
    content: string;
    directPath: string;
    url: string;
}> {
    const supabase = await createClient();
    const url = "/docs/" + slugs.join("/");

    // If there are no slugs, we can't know what page to look for.
    if (!slugs || slugs.length === 0) {
        // You could add logic here to find 'index.mdx' if you want a default root page
        // This will stop execution and render your app/not-found.tsx file
        notFound();
    }

    const directPath = slugs.join("/") + ".mdx";

    try {
        // 1. Try the direct path (e.g., /mobile/intro.mdx)
        const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .download(directPath);

        if (!error && data) {
            const rawContent = await data.text();
            const { data: frontmatter, content } = matter(rawContent);
            return {
                frontmatter: frontmatter as Frontmatter,
                content,
                directPath,
                url,
            };
        }

        // If both attempts fail, return the custom not-found page
        throw new Error("Not Found Page!");
    } catch (err) {
        console.error("An unexpected error occurred in getPage:", err);
        throw new Error("An unexpected error occurred");
    }
}

export async function getPageTree(): Promise<PageTree.Root> {
    const allPaths = await listAllFilePaths();

    // 1. (Optional but recommended) Sort initial paths for consistency
    allPaths.sort((a, b) =>
        a.storage_object_path!.localeCompare(b.storage_object_path!)
    );

    const root: PageTree.Root = {
        name: "Docs",
        children: [],
    };

    for (const fullPath of allPaths) {
        if (
            !fullPath.storage_object_path ||
            !fullPath.storage_object_path.endsWith(".mdx")
        ) {
            continue;
        }

        const parts = fullPath.storage_object_path.split("/");
        const fileName = parts.pop()!;
        const dirParts = parts;

        let currentNode: PageTree.Folder | PageTree.Root = root;

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

        const url = "/docs/" +
            fullPath.storage_object_path.replace(/\.mdx?$/, "");
        const pageNode: PageTree.Item = {
            type: "page",
            name: fileName.replace(/\.mdx?$/, ""),
            url,
        };

        if (fileName.startsWith("index.")) {
            if ("type" in currentNode && currentNode.type === "folder") {
                currentNode.index = pageNode;
            }
        } else {
            currentNode.children.push(pageNode);
        }
    }

    // 2. Sort the completed tree structure just before returning
    sortTree(root);

    return root;
}

/**
 * Recursively sorts a page tree node's children.
 * "introduction" is always first, then folders, then pages.
 */
function sortTree(node: PageTree.Root | PageTree.Folder): void {
    if (!node.children) return;

    node.children.sort((a, b) => {
        const aName = String(a.name).toLowerCase();
        const bName = String(b.name).toLowerCase();

        // Rule 1: "introduction" always comes first (case-insensitive).
        if (aName === "introduction" && bName !== "introduction") return -1;
        if (bName === "introduction" && aName !== "introduction") return 1;

        // Rule 2: Folders are listed before pages.
        if (a.type === "folder" && b.type === "page") return -1;
        if (a.type === "page" && b.type === "folder") return 1;

        // Rule 3: All other items are sorted alphabetically.
        return String(a.name).localeCompare(String(b.name));
    });

    // Recursively sort the children of each folder
    for (const child of node.children) {
        if (child.type === "folder") {
            sortTree(child);
        }
    }
}

// export async function getPages(): Promise<Page[]> {
//     // Use the new recursive helper function
//     const allFiles = await listAllFilePaths();

//     // Filter for .mdx files and map them to the required structure
//     return allFiles
//         .filter((file) => file.name.endsWith(".mdx"))
//         .map((file) => {
//             // Remove the .mdx extension
//             const pathWithoutExt = file.name.slice(0, -4);
//             const slugs = pathWithoutExt.split("/");

//             // If the last part of the slug is 'index', remove it for a cleaner URL
//             if (slugs[slugs.length - 1] === "index") {
//                 slugs.pop();
//             }

//             return {
//                 path: file.name,
//                 slug: slugs,
//             };
//         });
// }
