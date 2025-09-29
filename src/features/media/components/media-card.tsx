"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useState } from "react";
import { Button } from "../../../components/ui/button";
import { Copy, ExternalLink, Loader2, Trash, Trash2 } from "lucide-react";
import { deleteMedia } from "../actions/media-actions";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface ImageZoomProps {
  src: string;
  name: string;
  alt: string;
  className?: string;
  zoomedClassName?: string;
}

export function ImageZoom({
  src,
  name,
  alt,
  className,
  zoomedClassName,
  ...props
}: ImageZoomProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  // 3. Create a mutation for the delete action
  const { mutate: handleDelete, isPending: isDeleting } = useMutation({
    mutationFn: () => deleteMedia(name),
    onSuccess: () => {
      // ✅ This is the key part for refreshing your list!
      // Replace ['media'] with the actual queryKey you use to fetch the media list.
      queryClient.invalidateQueries({ queryKey: ["media"] });
    },
    onError: (error) => {
      alert(`Failed to delete file: ${error.message}`);
    },
  });

  const { mutate: handleCopyUrl, isPending: isCopying } = useMutation({
    mutationFn: async () => {
      // const data = await getPublicUrl(name);
      // await navigator.clipboard.writeText(data.publicUrl);
      await navigator.clipboard.writeText(src);

      // It's good practice to notify the user of success
      // alert("URL copied to clipboard!");
    },
    onError: (error) => {
      alert(`Failed to copy URL: ${error.message}`);
    },
  });

  const isAnyLoading = isCopying || isDeleting;

  return (
    <Dialog open={open}>
      <DialogTrigger asChild>
        <div
          className={cn(
            "relative aspect-square overflow-hidden group w-full h-full  rounded-lg",
            "transition-all duration-200 hover:opacity-90",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            className
          )}
          {...props}
        >
          <Image
            src={src}
            alt={alt}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 25vw, 17vw"
            quality={50}
            loading="lazy"
            placeholder="blur"
            blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mO0OAMAAUIBBnFrxGwAAAAASUVORK5CYII="
            className="object-contain"
          />
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleCopyUrl()}
              className="bg-background/90 hover:bg-background text-foreground"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy URL
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setOpen(true)}
              className="bg-background/90 hover:bg-background text-foreground"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleDelete()}
              className="bg-destructive/90 hover:bg-destructive text-destructive-foreground"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
          {isAnyLoading && (
            <div className="absolute inset-0 bg-muted/80 flex flex-col items-center justify-center text-sm backdrop-blur-sm">
              {isDeleting && <Trash />}
              <Loader2 className="h-4 w-4 animate-spin mt-2" />
            </div>
          )}
        </div>
      </DialogTrigger>

      <DialogContent
        // remove border, background, shadow, and close button
        className={cn(
          "max-w-[95vw] max-h-[95vh] w-auto h-auto p-0 border-0 bg-transparent shadow-none",
          "data-[state=open]:animate-none", // disable animations if you want
          "[&>button]:hidden", // hide default X button
          zoomedClassName
        )}
      >
        <DialogTitle className="sr-only">{alt}</DialogTitle>
        <DialogDescription className="sr-only">
          A larger view of the image: {alt}
        </DialogDescription>

        {open && (
          <div
            className="relative w-[95vw] h-[95vh] flex items-center justify-center"
            // close when clicking background or the image itself
            onClick={() => setOpen(false)}
          >
            <Image
              src={src}
              alt={alt}
              fill
              sizes="95vw"
              quality={100}
              priority
              className="object-contain max-w-full max-h-full w-auto h-auto rounded-lg cursor-zoom-out"
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
