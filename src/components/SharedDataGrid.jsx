import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SharedDataGrid({ data = [], columns = [], onRowClick }) {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const sortedData = React.useMemo(() => {
    let sortableItems = [...data];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [data, sortConfig]);

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const currentData = sortedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  return (
    <div className="border rounded-md shadow-sm bg-white dark:bg-[#1e1e1e]">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-gray-100 dark:bg-[#2a2a2a]">
            <TableRow>
              {columns.map((col) => (
                <TableHead 
                  key={col.key} 
                  className={cn("font-bold text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-gray-200 dark:hover:bg-[#333] transition-colors", col.className)}
                  onClick={() => requestSort(col.key)}
                >
                  <div className="flex items-center gap-2">
                    {col.label}
                    <ArrowUpDown className="h-3 w-3 text-gray-400" />
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentData.length > 0 ? (
              currentData.map((row, rowIndex) => (
                <TableRow 
                  key={row.id || rowIndex} 
                  className={cn("hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors cursor-pointer", rowIndex % 2 === 0 ? "bg-white dark:bg-[#1e1e1e]" : "bg-gray-50/50 dark:bg-[#252525]")}
                  onClick={() => onRowClick && onRowClick(row)}
                >
                  {columns.map((col) => (
                    <TableCell key={`${row.id}-${col.key}`} className="py-3">
                      {col.render ? col.render(row) : row[col.key]}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  No records found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {totalPages > 1 && (
        <div className="flex items-center justify-end space-x-2 py-4 px-4 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}