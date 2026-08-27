"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface EventPaginationProps {
  currentPage: number;
  totalPages: number;
  /** Index of the first item on this page, 1-based, for the "X–Y of Z" label. */
  rangeStart: number;
  rangeEnd: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  className?: string;
}

/**
 * Page numbers to render, with `null` standing in for an ellipsis. Always
 * shows first, last, current, and current's neighbours so the control keeps a
 * stable width no matter how many pages there are.
 */
function getPageItems(
  currentPage: number,
  totalPages: number
): Array<number | null> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set<number>([
    1,
    totalPages,
    currentPage - 1,
    currentPage,
    currentPage + 1,
  ]);

  // Keep the control from collapsing at the ends, where a neighbour falls
  // outside the range and would otherwise leave a short row.
  if (currentPage <= 3) {
    pages.add(2).add(3).add(4);
  }
  if (currentPage >= totalPages - 2) {
    pages.add(totalPages - 1).add(totalPages - 2).add(totalPages - 3);
  }

  const sorted = Array.from(pages)
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b);

  const items: Array<number | null> = [];
  let previous = 0;
  for (const page of sorted) {
    if (previous && page - previous > 1) {
      items.push(null);
    }
    items.push(page);
    previous = page;
  }

  return items;
}

export function EventPagination({
  currentPage,
  totalPages,
  rangeStart,
  rangeEnd,
  totalItems,
  onPageChange,
  className,
}: EventPaginationProps) {
  if (totalPages <= 1) return null;

  const pageItems = getPageItems(currentPage, totalPages);

  return (
    <nav
      aria-label="Events pagination"
      className={cn(
        "w-full max-w-[1200px] mx-auto flex flex-col items-center gap-3 px-4",
        className
      )}
    >
      <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Previous page"
          className="bg-secondary text-foreground border-secondary-light disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Prev</span>
        </Button>

        {pageItems.map((page, index) =>
          page === null ? (
            <span
              key={`ellipsis-${index}`}
              aria-hidden="true"
              className="px-1 text-sm text-muted-foreground select-none"
            >
              …
            </span>
          ) : (
            <Button
              key={page}
              type="button"
              variant="outline"
              onClick={() => onPageChange(page)}
              aria-label={`Go to page ${page}`}
              aria-current={page === currentPage ? "page" : undefined}
              className={cn(
                "h-9 w-9 sm:h-10 sm:w-10 p-0 font-bold",
                page === currentPage
                  ? "bg-secondary-light text-charcoal border-secondary-light hover:bg-secondary-light"
                  : "bg-secondary text-foreground border-secondary-light hover:bg-secondary-dark"
              )}
            >
              {page}
            </Button>
          )
        )}

        <Button
          type="button"
          variant="outline"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Next page"
          className="bg-secondary text-foreground border-secondary-light disabled:opacity-40"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <p aria-live="polite" className="text-sm text-muted-foreground">
        Showing {rangeStart}–{rangeEnd} of {totalItems} events
      </p>
    </nav>
  );
}
