"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { resolvedTheme } = useTheme();

  return (
    <Sonner
      theme={resolvedTheme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-fd-background group-[.toaster]:text-fd-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-fd-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-fd-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-fd-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
