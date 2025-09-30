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
import { Button } from "@/components/ui/button";
import { Copy, ExternalLink, Trash2 } from "lucide-react";
import { deleteMedia } from "../_lib/actions";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

interface ImageZoomProps {
  url: string;
  name: string;
  alt: string;
  className?: string;
  zoomedClassName?: string;
}

export function ImageCard({
  url,
  name,
  alt,
  className,
  zoomedClassName,
  ...props
}: ImageZoomProps) {
  const [open, setOpen] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: async (name: string) => {
      return toast.promise(deleteMedia(name), {
        loading: "Deleting image...",
        success: "Successfully deleted image.",
        error: (err: Error) => `Failed to image file: ${err.message}`,
      });
    },
  });

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
            src={url}
            alt={alt}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 25vw, 17vw"
            loading="lazy"
            placeholder="blur"
            blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mO0OAMAAUIBBnFrxGwAAAAASUVORK5CYII="
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={async () => {
                await navigator.clipboard.writeText(url);
                toast.success("Successfully copied to clipboard");
              }}
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
              onClick={() => deleteMutation.mutate(name)}
              className="bg-destructive/90 hover:bg-destructive text-destructive-foreground"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </DialogTrigger>

      <DialogContent
        className={cn(
          "max-w-[95vw] max-h-[95vh] w-auto h-auto p-0 border-0 bg-transparent shadow-none",
          "data-[state=open]:animate-none",
          "[&>button]:hidden",
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
            onClick={() => setOpen(false)}
          >
            <Image
              src={url}
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
