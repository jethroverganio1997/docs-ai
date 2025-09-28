"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RootProvider } from "fumadocs-ui/provider";
import { useMemo } from "react";
import SupabaseSearchDialog from "../features/search/components/fulltext-search";
// import { SearchDialog } from "fumadocs-ui/components/dialog/search";

export default function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = useMemo(() => new QueryClient(), []);
  return (
    <QueryClientProvider client={queryClient}>
      <RootProvider
        search={{
          SearchDialog: SupabaseSearchDialog,
        }}
      >
        {children}
      </RootProvider>
    </QueryClientProvider>
  );
}
