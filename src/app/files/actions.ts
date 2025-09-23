// no "use client" here
import { revalidatePath } from "next/cache";
import { createClient } from "../../lib/supabase/server";

export async function revalidateFilesPage() {
  revalidatePath("/files");
}

export async function downloadFile(path: string | null) {
  if (!path) throw new Error("Invalid file path");
  const supabase = await createClient();

  const { data, error } = await supabase.storage
    .from("files")
    .createSignedUrl(path, 60);

  if (error) throw error;
  return data.signedUrl;
}

export async function deleteFile(path: string | null) {
  if (!path) throw new Error("Invalid file path");
  const supabase = await createClient();

  const { error } = await supabase.storage.from("files").remove([path]);
  if (error) throw error;

  await revalidateFilesPage();
  return true;
}
