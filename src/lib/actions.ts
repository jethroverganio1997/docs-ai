"use server"

import { revalidatePath, revalidateTag } from "next/cache";

/**
 * Revalidates a specific path.
 */
export async function revalidatePathAction(path: string) {
  revalidatePath(path);
}

/**
 * Revalidates a specific cache tag.
 */
export async function revalidateTagAction(tag: string) {
  revalidateTag(tag);
}