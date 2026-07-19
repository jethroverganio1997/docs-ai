"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RootProvider } from "fumadocs-ui/provider";
import { useMemo } from "react";
import DocsSearchDialog from "@/features/search/components/docs-search-dialog";
import { Toaster } from "../components/ui/sonner";

export default function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = useMemo(() => new QueryClient(), []);
  return (
    <QueryClientProvider client={queryClient}>
      <RootProvider
        search={{
          SearchDialog: DocsSearchDialog,
        }}
      >
        {children}
        <Toaster />
      </RootProvider>
    </QueryClientProvider>
  );
}
