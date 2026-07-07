/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import * as React from "react";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  CaretUpIcon,
  CaretDownIcon,
  CaretUpDownIcon,
  FunnelIcon,
} from "@phosphor-icons/react";

import { cn } from "@/lib/helpers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type DataTableColumn<T> = {
  key: string;
  header: string;
  accessor: (row: T) => React.ReactNode;
  searchValue?: (row: T) => string;
  /** Value used for sorting; falls back to searchValue. Provide a number for numeric sort. */
  sortValue?: (row: T) => string | number;
  /** Disable sorting on this column (default: sortable when sortValue/searchValue exists). */
  sortable?: boolean;
  className?: string;
};

type SortState = { key: string; dir: "asc" | "desc" };

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  rowKey: (row: T) => string;
  searchPlaceholder?: string;
  createLabel?: string;
  onCreate?: () => void;
  pageSize?: number;
  loading?: boolean;
  /** Extra filter controls rendered inline next to the search box. */
  filters?: React.ReactNode;
  /** Initial sort applied before the user interacts with column headers. */
  defaultSort?: SortState;
  /** On mobile, collapse search + filters into a right-side sheet behind a Filter button. */
  searchInSheet?: boolean;
}

function getPageRange(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const pages: (number | "ellipsis")[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) pages.push("ellipsis");
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < total - 1) pages.push("ellipsis");
  pages.push(total);
  return pages;
}

export function DataTable<T>({
  columns,
  data,
  rowKey,
  searchPlaceholder = "Search...",
  createLabel,
  onCreate,
  pageSize = 20,
  loading = false,
  filters,
  defaultSort,
  searchInSheet = false,
}: DataTableProps<T>) {
  const [query, setQuery] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [sort, setSort] = React.useState<SortState | null>(defaultSort ?? null);
  const [filterOpen, setFilterOpen] = React.useState(false);

  const isSortable = React.useCallback(
    (col: DataTableColumn<T>) =>
      col.key !== "actions" && col.sortable !== false && !!(col.sortValue || col.searchValue),
    [],
  );

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return data;
    return data.filter((row) =>
      columns.some((col) => {
        const value = col.searchValue ? col.searchValue(row) : "";
        return value.toLowerCase().includes(q);
      }),
    );
  }, [data, columns, query]);

  const sorted = React.useMemo(() => {
    if (!sort) return filtered;
    const col = columns.find((c) => c.key === sort.key);
    if (!col) return filtered;
    const getVal = col.sortValue ?? (col.searchValue ? (r: T) => col.searchValue!(r) : null);
    if (!getVal) return filtered;
    const arr = [...filtered].sort((a, b) => {
      const va = getVal(a);
      const vb = getVal(b);
      const cmp =
        typeof va === "number" && typeof vb === "number"
          ? va - vb
          : String(va).localeCompare(String(vb), undefined, { numeric: true });
      return sort.dir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [filtered, sort, columns]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const pageRows = sorted.slice(start, start + pageSize);

  const toggleSort = (key: string) => {
    setSort((prev) => {
      if (!prev || prev.key !== key) return { key, dir: "asc" };
      if (prev.dir === "asc") return { key, dir: "desc" };
      return null;
    });
  };

  React.useEffect(() => {
    setPage(1);
  }, [query, sort]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div className={cn("flex flex-1 items-center gap-2", searchInSheet && "hidden md:flex")}>
          <div className="relative w-full max-w-sm">
            <MagnifyingGlassIcon
              size={16}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchPlaceholder}
              className="pl-8"
            />
          </div>
          {filters}
        </div>

        {searchInSheet && (
          <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="md:hidden">
                <FunnelIcon size={16} />
                Filter
              </Button>
            </SheetTrigger>
            <SheetContent side="right" aria-describedby={undefined}>
              <SheetHeader>
                <SheetTitle>Filter</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-3 px-4 pb-4">
                <div className="relative w-full">
                  <MagnifyingGlassIcon
                    size={16}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder={searchPlaceholder}
                    className="pl-8"
                  />
                </div>
                {filters}
              </div>
            </SheetContent>
          </Sheet>
        )}

        {createLabel && (
          <Button onClick={onCreate}>
            <PlusIcon size={16} />
            {createLabel}
          </Button>
        )}
      </div>

      <div className="hidden overflow-x-auto rounded-md border md:block">
        <Table>
          <TableHeader className="bg-background">
            <TableRow>
              {columns.map((col) => {
                const sortable = isSortable(col);
                const active = sort?.key === col.key;
                return (
                  <TableHead
                    key={col.key}
                    className={cn(
                      col.className,
                      col.key === "actions" && "sticky right-0 border-l bg-background",
                    )}
                  >
                    {sortable ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(col.key)}
                        className="-ml-1 flex items-center gap-1 rounded-sm px-1 py-0.5 hover:text-foreground"
                      >
                        {col.header}
                        {active ? (
                          sort?.dir === "asc" ? (
                            <CaretUpIcon size={12} weight="bold" />
                          ) : (
                            <CaretDownIcon size={12} weight="bold" />
                          )
                        ) : (
                          <CaretUpDownIcon size={12} className="text-muted-foreground/60" />
                        )}
                      </button>
                    ) : (
                      col.header
                    )}
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: pageSize }).map((_, rowIndex) => (
                <TableRow key={`skeleton-${rowIndex}`}>
                  {columns.map((col) => (
                    <TableCell
                      key={col.key}
                      className={cn(
                        col.className,
                        col.key === "actions" && "sticky right-0 border-l bg-background",
                      )}
                    >
                      <Skeleton className="h-4 w-full max-w-30" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : pageRows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  No results.
                </TableCell>
              </TableRow>
            ) : (
              pageRows.map((row, rowIndex) => (
                <TableRow key={`${rowKey(row)}-${rowIndex}`}>
                  {columns.map((col) => (
                    <TableCell
                      key={col.key}
                      className={cn(
                        col.className,
                        col.key === "actions" && "sticky right-0 border-l bg-background",
                      )}
                    >
                      {col.accessor(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-3 md:hidden">
        {loading ? (
          Array.from({ length: 5 }).map((_, index) => (
            <div key={`skeleton-card-${index}`} className="flex flex-col gap-3 rounded-md border p-4">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          ))
        ) : pageRows.length === 0 ? (
          <div className="rounded-md border p-6 text-center text-sm text-muted-foreground">
            No results.
          </div>
        ) : (
          pageRows.map((row, rowIndex) => {
            const actionsCol = columns.find((col) => col.key === "actions");
            return (
              <div
                key={`card-${rowKey(row)}-${rowIndex}`}
                className="flex flex-col gap-2 rounded-md border p-4"
              >
                {columns
                  .filter((col) => col.key !== "actions")
                  .map((col) => (
                    <div key={col.key} className="flex items-start justify-between gap-3">
                      <span className="shrink-0 text-xs font-medium">{col.header}</span>
                      <span className="min-w-0 break-all text-right text-sm">
                        {col.accessor(row)}
                      </span>
                    </div>
                  ))}
                {actionsCol && (
                  <div className="flex justify-start border-t pt-2">{actionsCol.accessor(row)}</div>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {filtered.length === 0
            ? "0 results"
            : `Showing ${start + 1}-${Math.min(
                start + pageSize,
                filtered.length,
              )} of ${filtered.length}`}
        </p>
        <Pagination className="mx-0 w-auto justify-end">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                aria-disabled={currentPage === 1}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                onClick={(event) => {
                  event.preventDefault();
                  if (currentPage > 1) setPage(currentPage - 1);
                }}
              />
            </PaginationItem>
            {getPageRange(currentPage, totalPages).map((entry, index) =>
              entry === "ellipsis" ? (
                <PaginationItem key={`ellipsis-${index}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={entry}>
                  <PaginationLink
                    href="#"
                    isActive={entry === currentPage}
                    onClick={(event) => {
                      event.preventDefault();
                      setPage(entry);
                    }}
                  >
                    {entry}
                  </PaginationLink>
                </PaginationItem>
              ),
            )}
            <PaginationItem>
              <PaginationNext
                href="#"
                aria-disabled={currentPage === totalPages}
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                onClick={(event) => {
                  event.preventDefault();
                  if (currentPage < totalPages) setPage(currentPage + 1);
                }}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}
