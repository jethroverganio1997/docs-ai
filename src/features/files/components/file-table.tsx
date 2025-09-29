"use client";

import * as React from "react";
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
import { DocumentView } from "../../../types/document-view";
import {
  getFileName,
  getFilePath,
  getFileType,
  getFileUrl,
} from "../../../lib/utils";
import { deleteFile, downloadFile } from "../actions/files-actions";
import { Badge } from "../../../components/ui/badge";
import { useMutation, useQueryClient } from "@tanstack/react-query";

// export const columns: ColumnDef<DocumentView>[] = [
//   {
//     accessorKey: "name",
//     header: ({ column }) => {
//       return (
//         <Button
//           variant="ghost"
//           onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
//         >
//           Name
//           <ArrowUpDown />
//         </Button>
//       );
//     },
//     cell: ({ row }) => (
//       <div className="lowercase pl-4">{getFileName(row.getValue("name"))}</div>
//     ),
//   },
//   {
//     accessorKey: "type",
//     header: () => <div>Type</div>,
//     cell: ({ row }) => (
//       <Badge variant="secondary" className="lowercase">
//         {getFileType(row.getValue("name"))}
//       </Badge>
//     ),
//   },
//   {
//     accessorKey: "path",
//     header: () => <div>Path</div>,
//     cell: ({ row }) => (
//       <div className="lowercase">{getFilePath(row.getValue("name"))}</div>
//     ),
//   },
//   {
//     accessorKey: "createat",
//     header: () => <div>Date Upload</div>,
//     cell: ({ row }) => {
//       const createdAt = row.original.created_at;

//       // Format it to YYYY-MM-DD
//       const formattedDate = createdAt
//         ? new Date(createdAt).toISOString().split("T")[0]
//         : "";
//       return <div className="lowercase">{formattedDate}</div>;
//     },
//   },
//   {
//     id: "actions",
//     enableHiding: false,
//     header: () => <div>Actions</div>,
//     cell: ({ row }) => {
//       const docs = row.original;

//       return (
//         <DropdownMenu>
//           <DropdownMenuTrigger asChild>
//             <Button variant="ghost" className="h-8 w-8 p-0">
//               <span className="sr-only">Open menu</span>
//               <MoreHorizontal />
//             </Button>
//           </DropdownMenuTrigger>
//           <DropdownMenuContent align="end">
//             <DropdownMenuItem
//               onClick={() => {
//                 if (typeof window !== "undefined") {
//                   const origin = window.location.origin;
//                   const url = getFileUrl(origin, docs.name);
//                   // The '_blank' target opens the URL in a new tab
//                   // 'noopener,noreferrer' is for security reasons
//                   window.open(url, "_blank", "noopener,noreferrer");
//                 }
//               }}
//             >
//               View Docs
//             </DropdownMenuItem>
//             <DropdownMenuSeparator />
//             <DropdownMenuItem
//               onClick={() =>
//                 navigator.clipboard.writeText(getFilePath(docs.name))
//               }
//             >
//               Copy Path
//             </DropdownMenuItem>
//             <DropdownMenuItem
//               onClick={() => {
//                 if (typeof window !== "undefined") {
//                   const origin = window.location.origin;
//                   return navigator.clipboard.writeText(
//                     getFileUrl(origin, docs.name)
//                   );
//                 }
//               }}
//             >
//               Copy Full Url
//             </DropdownMenuItem>
//             <DropdownMenuSeparator />
//             <DropdownMenuItem
//               onClick={async () => {
//                 const url = await downloadFile(
//                   row.original.storage_object_path
//                 );
//                 if (url) window.location.href = url;
//               }}
//             >
//               Download File
//             </DropdownMenuItem>
//             <DropdownMenuItem
//               onClick={async () => {
//                 await deleteFile(row.original.storage_object_path)
//                 }
//               }
//             >
//               Delete File
//             </DropdownMenuItem>
//           </DropdownMenuContent>
//         </DropdownMenu>
//       );
//     },
//   },
// ];

// Props for the component
interface DocumentTableProps {
  data: DocumentView[];
}

export function FilesDataTable({ data }: DocumentTableProps) {
  const queryClient = useQueryClient();
  const [sorting, setSorting] = React.useState<SortingState>([]);

  // NEW: Set up the mutation for deleting a file
  const deleteMutation = useMutation({
    mutationFn: deleteFile, // The async function to call for the mutation

    // This function will run after the mutation is successful
    onSuccess: () => {
      console.log("File deleted successfully, invalidating documents query...");

      // IMPORTANT: Invalidate the query that fetches the table data.
      // Replace ['documents'] with the actual query key you use to fetch this data.
      queryClient.invalidateQueries({ queryKey: ["docsSearch"] });
      queryClient.invalidateQueries({ queryKey: ["files"] });
    },
    onError: (error) => {
      // Optional: Handle errors, e.g., show a toast notification
      console.error("Failed to delete file:", error);
    },
  });

  const columns = React.useMemo<ColumnDef<DocumentView>[]>(
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
        header: () => <div>Date Upload</div>,
        cell: ({ row }) => {
          const createdAt = row.original.created_at;

          // Format it to YYYY-MM-DD
          const formattedDate = createdAt
            ? new Date(createdAt).toISOString().split("T")[0]
            : "";
          return <div className="lowercase">{formattedDate}</div>;
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
                  onClick={() =>
                    navigator.clipboard.writeText(getFilePath(docs.name))
                  }
                >
                  Copy Path
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    if (typeof window !== "undefined") {
                      const origin = window.location.origin;
                      return navigator.clipboard.writeText(
                        getFileUrl(origin, docs.name)
                      );
                    }
                  }}
                >
                  Copy Full Url
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={async () => {
                    const url = await downloadFile(
                      row.original.storage_object_path
                    );
                    if (url) window.location.href = url;
                  }}
                >
                  Download File
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={async () => {
                    await deleteFile(row.original.storage_object_path);
                    deleteMutation.mutate(row.original.storage_object_path);
                  }}
                >
                  Delete File
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
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
