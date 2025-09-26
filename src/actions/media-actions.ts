"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "../lib/supabase/server";
import { MediaObject } from "../types/media-object";

const BUCKET_NAME = "media";

export async function getMedia(): Promise<MediaObject[]> {
    const supabase = await createClient();

    const { data: image, error } = await supabase.storage
        .from("media")
        .list();

    if (error) {
        console.log(JSON.stringify(error));
        throw new Error("Files not found", error);
    }

    return image as MediaObject[];
}

export async function getPublicUrl(path: string | null) {
    if (!path) throw new Error("Invalid file path");
    const supabase = await createClient();

    const { data } = await supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(path);

    return data;
}

export async function deleteMedia(path: string | null) {
    if (!path) throw new Error("Invalid file path");
    const supabase = await createClient();

    const { error } = await supabase.storage.from(BUCKET_NAME).remove([path]);
    if (error) throw error;

    revalidatePath("/media");
    return true;
}
