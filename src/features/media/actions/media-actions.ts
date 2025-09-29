"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "../../../lib/supabase/server";
import { MediaObject } from "../../../types/media-object";

const BUCKET_NAME = "media";

export async function getMedia(): Promise<{name: string, url:string}[]> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { data: images, error } = await supabase.rpc("get_media_by_user", {
        user_id: user?.id,
    });

    if (error) {
        console.error("Error listing files:", error);
        return [];
    }

    if (!images || images.length === 0) {
        return [];
    }

    const urls = images.map((image: MediaObject) => {
        // Construct the transformable URL
        const { data } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(image.name);

        // IMPORTANT: Replace '/object/public/' with '/render/image/public/'
        const transformableUrl = data.publicUrl.replace(
            "/object/public/",
            "/render/image/public/",
        );

        return {
            name: image.name,
            url: `${transformableUrl}?quality=80`,
        };
    });

    return urls;
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
