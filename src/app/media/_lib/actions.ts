"use server";

import { revalidateTag } from "next/cache";
import { createClient } from "../../../lib/supabase/server";
import { MediaObject } from "../../../types/media-object";
import { cookies } from "next/headers";
import { BUCKET_MEDIA_NAME, MEDIA_IMAGES_TAG} from "./constants";
import { MediaType } from "./types";

export async function getMedia(
    cookieStore: ReturnType<typeof cookies>,
): Promise<MediaType[]> {
    const supabase = await createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    const { data: images, error } = await supabase.rpc("get_media_by_user", {
        user_id: user?.id,
    });

    if (error) {
        throw new Error("Error listing files:", error);
    }

    if (!images || images.length === 0) {
        return [];
    }

    const urls = images.map((image: MediaObject) => {
        // Construct the transformable URL
        const { data } = supabase.storage
            .from(BUCKET_MEDIA_NAME)
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

export async function getPublicUrl(path: string | null): Promise<string> {
    if (!path) throw new Error("Invalid file path");
    const supabase = await createClient();

    const { data } = supabase.storage
        .from(BUCKET_MEDIA_NAME)
        .getPublicUrl(path);

    return data.publicUrl;
}

export async function deleteMedia(path: string | null): Promise<boolean> {
    if (!path) throw new Error("Invalid file path");
    const supabase = await createClient();

    const { error } = await supabase.storage.from(BUCKET_MEDIA_NAME).remove([
        path,
    ]);
    if (error) throw error;

    revalidateTag(MEDIA_IMAGES_TAG);
    return true;
}
