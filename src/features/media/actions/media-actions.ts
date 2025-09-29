"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "../../../lib/supabase/server";
import { MediaObject } from "../../../types/media-object";

const BUCKET_NAME = "media";

export async function getMedia(): Promise<MediaObject[]> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    console.log(user?.id);

    const { data: images, error } = await supabase.rpc("get_media_by_user", {
        user_id: user?.id,
    });

    if (error) {
        console.log(JSON.stringify(error));
        throw new Error("Files not found", error);
    }

    return images as MediaObject[];
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
