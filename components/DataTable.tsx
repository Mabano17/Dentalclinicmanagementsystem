"use client";

import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { LoadingRow } from "./Loading";

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

interface PaginationProps {
  page: number;
  totalCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  keyExtractor?: (row: T) => string | number;
  pagination?: PaginationProps;
}

export default function DataTable<T>({
  columns,
  data,
  loading = false,
  emptyMessage = "No records found.",
  keyExtractor,
  pagination,
}: DataTableProps<T>) {
  const page = pagination?.page ?? 1;
  const totalCount = pagination?.totalCount;
  const pageSize = pagination?.pageSize ?? 10;
  const onPageChange = pagination?.onPageChange;
  const totalPages = totalCount ? Math.ceil(totalCount / pageSize) : 1;
  return (
    <div className="flex flex-col gap-4">
      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key} className={col.className}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <LoadingRow cols={columns.length} />
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-12 text-center text-gray-400 text-sm"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr key={keyExtractor ? keyExtractor(row) : (row as Record<string, unknown>).id as string ?? i}>
                  {columns.map((col) => (
                    <td key={col.key} className={col.className}>
                      {col.render
                        ? col.render(row)
                        : // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          String((row as any)[col.key] ?? "—")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {onPageChange && totalPages > 1 && (
        <div className="flex items-center justify-between px-1">
          <p className="text-sm text-gray-500">
            {totalCount !== undefined ? (
              <>
                Showing{" "}
                <span className="font-medium">
                  {Math.min((page - 1) * pageSize + 1, totalCount ?? 0)}–
                  {Math.min(page * pageSize, totalCount ?? 0)}
                </span>{" "}
                of <span className="font-medium">{totalCount}</span> records
              </>
            ) : (
              `Page ${page} of ${totalPages}`
            )}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <FiChevronLeft className="w-4 h-4" />
            </button>

            {[...Array(Math.min(totalPages, 7))].map((_, i) => {
              const p = i + 1;
              return (
                <button
                  key={p}
                  onClick={() => onPageChange(p)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                    p === page
                      ? "bg-blue-600 text-white"
                      : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {p}
                </button>
              );
            })}

            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <FiChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
