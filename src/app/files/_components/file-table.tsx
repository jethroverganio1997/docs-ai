"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatDateWithTime,
  getFileName,
  getFilePath,
  getFileType,
  getFileUrl,
} from "../../../lib/helpers";
import { deleteFile, downloadFile } from "../_lib/actions";
import { Badge } from "../../../components/ui/badge";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FilesDocuments } from "../_lib/types";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { DOCS_SEARCH_TAG } from "../../_search/lib/constants";
import { LAYOUT_TREE_TAG } from "../../docs/_lib/constants";

interface DocumentTableProps {
  data: FilesDocuments[];
}

export function FilesDataTable({ data }: DocumentTableProps) {
  const queryClient = useQueryClient();
  const [sorting, setSorting] = useState<SortingState>([]);

  const downloadMutation = useMutation({
    mutationFn: async (path: string) => {
      return toast.promise(downloadFile(path), {
        loading: "Downloading...",
        success: (signedUrl) => {
          window.location.href = signedUrl;
          return "Successfully downloaded file.";
        },
        error: (err: Error) => `Failed to download file: ${err.message}`,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (name: string) => {
      return toast.promise(deleteFile(name), {
        loading: "Deleting file...",
        success: "Successfully deleted file.",
        error: (err: Error) => `Failed to delete file: ${err.message}`,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DOCS_SEARCH_TAG] });
      queryClient.invalidateQueries({ queryKey: [LAYOUT_TREE_TAG] });
    },
  });

  const columns = useMemo<ColumnDef<FilesDocuments>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            >
              Name
              <ArrowUpDown />
            </Button>
          );
        },
        cell: ({ row }) => (
          <div className="lowercase pl-4">
            {getFileName(row.getValue("name"))}
          </div>
        ),
      },
      {
        accessorKey: "type",
        header: () => <div>Type</div>,
        cell: ({ row }) => (
          <Badge variant="secondary" className="lowercase">
            {getFileType(row.getValue("name"))}
          </Badge>
        ),
      },
      {
        accessorKey: "path",
        header: () => <div>Path</div>,
        cell: ({ row }) => (
          <div className="lowercase">{getFilePath(row.getValue("name"))}</div>
        ),
      },
      {
        accessorKey: "createat",
        header: () => <div>Update At</div>,
        cell: ({ row }) => {
          const updatedAt = row.original.updated_at;

          // Format it to YYYY-MM-DD HH:MM
          const formattedDate = formatDateWithTime(updatedAt);
          return <div>{formattedDate}</div>;
        },
      },
      {
        id: "actions",
        enableHiding: false,
        header: () => <div>Actions</div>,
        cell: ({ row }) => {
          const docs = row.original;

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => {
                    if (typeof window !== "undefined") {
                      const origin = window.location.origin;
                      const url = getFileUrl(origin, docs.name);
                      // The '_blank' target opens the URL in a new tab
                      // 'noopener,noreferrer' is for security reasons
                      window.open(url, "_blank", "noopener,noreferrer");
                    }
                  }}
                >
                  View Docs
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    if (typeof window !== "undefined") {
                      const origin = window.location.origin;
                      navigator.clipboard.writeText(
                        getFileUrl(origin, row.original.storage_object_path)
                      );
                      toast.success(`Successfully copied to clipboard`);
                    }
                  }}
                >
                  Copy Full Url
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    downloadMutation.mutate(row.original.storage_object_path)
                  }
                >
                  Download File
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    deleteMutation.mutate(row.original.storage_object_path)
                  }
                >
                  Delete File
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [deleteMutation] // Re-memoize if the mutation object changes
  );

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
    },
  });

  return (
    <div className="w-full">
      <div className="flex items-center py-4">
        <Input
          placeholder="Filter name..."
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("name")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
      </div>
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
