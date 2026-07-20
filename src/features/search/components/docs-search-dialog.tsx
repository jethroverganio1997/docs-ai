"use client";

import {
  SearchDialog,
  SearchDialogClose,
  SearchDialogContent,
  SearchDialogFooter,
  SearchDialogHeader,
  SearchDialogIcon,
  SearchDialogInput,
  SearchDialogList,
  SearchDialogListItem,
  SearchDialogOverlay,
  type SharedProps,
} from "fumadocs-ui/components/dialog/search";
import { useDocsSearch } from "../hooks/use-docs-search";

export default function DocsSearchDialog(props: SharedProps) {
  const { search, setSearch, query } = useDocsSearch({});

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
        <SearchDialogList
          items={
            query.data !== "empty"
              ? [...(Array.isArray(query.data) ? query.data : [])]
              : []
          }
          Item={(itemProps) => (
            <SearchDialogListItem
              {...itemProps}
              renderHighlights={(highlights) =>
                highlights.map((part, index) =>
                  part.styles?.highlight ? (
                    <span
                      key={index}
                      className="bg-violet-200 text-gradient font-semibold rounded px-0.5"
                    >
                      {part.content}
                    </span>
                  ) : (
                    <span key={index}>{part.content}</span>
                  ),
                )
              }
            />
          )}
        />
        <SearchDialogFooter>
          <p
            className={`ms-auto text-xs ${
              query.error ? "text-red-600" : "text-fd-muted-foreground"
            }`}
          >
            {query.error?.message ?? "Search powered by AWS RDS"}
          </p>
        </SearchDialogFooter>
      </SearchDialogContent>
    </SearchDialog>
  );
}
