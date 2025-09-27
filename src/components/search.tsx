"use client";

import {
  SearchDialog,
  SearchDialogClose,
  SearchDialogContent,
  SearchDialogHeader,
  SearchDialogIcon,
  SearchDialogInput,
  SearchDialogList,
  SearchDialogOverlay,
  type SharedProps,
} from "fumadocs-ui/components/dialog/search";
import { useDocsSearch } from "../hooks/use-docs-search";
import { useSupabaseHeaders } from "../hooks/use-supabase-header";

export default function DefaultSearchDialog(props: SharedProps) {
  const headers = useSupabaseHeaders();

  const { search, setSearch, query } = useDocsSearch({
    api: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/search`,
    headers, // <-- pass here
  });

  return (
    <SearchDialog
      search={search}
      onSearchChange={setSearch}
      isLoading={query.isLoading}
      {...props}
    >
      <SearchDialogOverlay />
      <SearchDialogContent>
        <SearchDialogHeader>
          <SearchDialogIcon />
          <SearchDialogInput />
          <SearchDialogClose />
        </SearchDialogHeader>
        <SearchDialogList items={query.data !== "empty" ? query.data : null} />
      </SearchDialogContent>
    </SearchDialog>
  );
}
