"use client";

import { Button } from "@/components/ui/button";

export function Pagination({
  page,
  total,
  pageSize,
  onPageChange,
}: {
  page: number;
  total: number;
  pageSize: number;
  onPageChange: (next: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / Math.max(1, pageSize)));
  const canPrev = page > 1;
  const canNext = page < totalPages;
  return (
    <div className="mt-4 flex items-center justify-between text-sm">
      <div className="text-muted-foreground">
        Hiển thị {(total === 0 ? 0 : (page - 1) * pageSize + 1)}–{Math.min(page * pageSize, total)} / {total}
      </div>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" disabled={!canPrev} onClick={() => canPrev && onPageChange(page - 1)}>
          Trước
        </Button>
        <span>
          Trang {page}/{totalPages}
        </span>
        <Button size="sm" variant="outline" disabled={!canNext} onClick={() => canNext && onPageChange(page + 1)}>
          Sau
        </Button>
      </div>
    </div>
  );
}

