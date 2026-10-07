import React, { useState, useMemo } from 'react';
import { Button } from './Button';
import { Input } from './Input';
import { Skeleton } from './Skeleton';
import { EmptyState } from './EmptyState';
import { Search, ChevronDown, ChevronUp, ChevronsUpDown, ChevronLeft, ChevronRight } from 'lucide-react';

export interface Column<T> {
  header: string;
  accessorKey: string;
  cell?: (row: T) => React.ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  searchPlaceholder?: string;
  searchKey?: string;
  pageSize?: number;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  loading = false,
  searchPlaceholder = 'Search records...',
  searchKey,
  pageSize = 10,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  // Filter Data
  const filteredData = useMemo(() => {
    if (!searchQuery || !searchKey) return data;
    return data.filter((item) => {
      const value = item[searchKey];
      if (value === null || value === undefined) return false;
      return String(value).toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [data, searchQuery, searchKey]);

  // Sort Data
  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];

      if (aVal === undefined || bVal === undefined) return 0;

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
      }

      const aString = String(aVal).toLowerCase();
      const bString = String(bVal).toLowerCase();

      if (aString < bString) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aString > bString) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig]);

  // Paginate Data
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const handleSort = (key: string, sortable?: boolean) => {
    if (!sortable) return;
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: string, sortable?: boolean) => {
    if (!sortable) return null;
    if (!sortConfig || sortConfig.key !== key) {
      return <ChevronsUpDown className="w-3.5 h-3.5 ml-1 text-dark-400 group-hover:text-dark-500" />;
    }
    return sortConfig.direction === 'asc' ? (
      <ChevronUp className="w-3.5 h-3.5 ml-1 text-primary-500" />
    ) : (
      <ChevronDown className="w-3.5 h-3.5 ml-1 text-primary-500" />
    );
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Search Header */}
      {searchKey && (
        <div className="flex items-center justify-between gap-4">
          <Input
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            leftIcon={<Search className="w-4 h-4 text-dark-400" />}
            className="max-w-sm"
          />
        </div>
      )}

      {/* Table Box */}
      <div className="relative w-full overflow-hidden rounded-2xl border border-dark-200 dark:border-dark-800 bg-white dark:bg-dark-900 shadow-sm">
        <div className="w-full overflow-x-auto custom-scrollbar">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-dark-200 dark:border-dark-800 bg-dark-50/50 dark:bg-dark-950/20 select-none">
                {columns.map((col) => (
                  <th
                    key={col.accessorKey}
                    onClick={() => handleSort(col.accessorKey, col.sortable)}
                    className={`px-6 py-4 font-bold text-dark-500 dark:text-dark-400 text-xs uppercase tracking-wider ${
                      col.sortable ? 'cursor-pointer group hover:text-dark-900 dark:hover:text-white' : ''
                    }`}
                  >
                    <div className="flex items-center">
                      <span>{col.header}</span>
                      {getSortIcon(col.accessorKey, col.sortable)}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-200 dark:divide-dark-800">
              {loading ? (
                // Loading Skeleton Rows
                Array.from({ length: pageSize }).map((_, rIdx) => (
                  <tr key={rIdx} className="bg-transparent">
                    {columns.map((col) => (
                      <td key={col.accessorKey} className="px-6 py-4.5">
                        <Skeleton className="h-4.5 w-full max-w-[80%]" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : paginatedData.length === 0 ? (
                // Empty State
                <tr>
                  <td colSpan={columns.length} className="p-0">
                    <EmptyState
                      title="No records found"
                      description="There are no items matching your criteria in the database."
                      className="border-none rounded-none shadow-none py-16"
                    />
                  </td>
                </tr>
              ) : (
                // Data Rows
                paginatedData.map((row, rIdx) => (
                  <tr
                    key={row.id || rIdx}
                    className="hover:bg-dark-50/40 dark:hover:bg-dark-850/30 transition-colors bg-transparent"
                  >
                    {columns.map((col) => {
                      const cellValue = row[col.accessorKey];
                      return (
                        <td key={col.accessorKey} className="px-6 py-4.5 text-dark-800 dark:text-dark-200 font-medium">
                          {col.cell ? col.cell(row) : cellValue !== null && cellValue !== undefined ? String(cellValue) : '-'}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-dark-200 dark:border-dark-800 select-none">
            <span className="text-xs text-dark-400 font-medium">
              Showing page {currentPage} of {totalPages} ({filteredData.length} records)
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                title="Previous Page"
                className="h-8.5 w-8.5 p-0"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              {Array.from({ length: totalPages }).map((_, idx) => {
                const p = idx + 1;
                const isCurrent = p === currentPage;
                // Show pages around current
                if (totalPages > 6 && Math.abs(p - currentPage) > 1 && p !== 1 && p !== totalPages) {
                  if (p === 2 || p === totalPages - 1) {
                    return <span key={p} className="px-1.5 text-xs text-dark-400 font-semibold select-none">...</span>;
                  }
                  return null;
                }
                return (
                  <Button
                    key={p}
                    variant={isCurrent ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => handlePageChange(p)}
                    className={`h-8.5 w-8.5 p-0 ${isCurrent ? 'shadow-none' : ''}`}
                  >
                    {p}
                  </Button>
                );
              })}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                title="Next Page"
                className="h-8.5 w-8.5 p-0"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
