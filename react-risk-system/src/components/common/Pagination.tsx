import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import CustomSelect from '../shared/CustomSelect';

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (size: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
}) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

  // Determine standard indices (1-indexed for display)
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show page 1
      pages.push(1);

      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);

      if (currentPage <= 2) {
        end = 4;
      } else if (currentPage >= totalPages - 1) {
        start = totalPages - 3;
      }

      if (start > 2) {
        pages.push('...');
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < totalPages - 1) {
        pages.push('...');
      }

      // Always show last page
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 bg-gray-50/50 border-t border-gray-100 rounded-b-lg select-none text-right font-medium text-gray-700">
      {/* Items Range Info */}
      <div className="text-lg text-gray-500">
        عرض <span className="font-bold text-gray-900">{startItem}</span> -{' '}
        <span className="font-bold text-gray-900">{endItem}</span> من أصل{' '}
        <span className="font-bold text-gray-900">{totalItems}</span> سجل
      </div>

      {/* Pagination Controls */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Page Size Selector */}
        <div className="flex items-center gap-2">
          <span className="text-lg text-gray-400">سجل في الصفحة:</span>
          <CustomSelect
            value={itemsPerPage}
            onChange={(value) => onItemsPerPageChange(Number(value))}
            options={[
              { value: 5, label: '5' },
              { value: 10, label: '10' },
              { value: 25, label: '25' },
              { value: 50, label: '50' },
              { value: 100000, label: 'الكل' }
            ]}
            placeholder="حدد الحجم"
            className="w-28"
          />
        </div>

        {/* Page Navigation */}
        <div className="flex items-center gap-1.5" style={{ direction: 'ltr' }}>
          {/* Previous Page (RTL direction: pointing right) */}
          <button
            onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`flex items-center justify-center w-11 h-11 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 active:bg-gray-100 transition-all cursor-pointer ${
              currentPage === 1 ? 'opacity-40 cursor-not-allowed hover:bg-white hover:border-gray-200' : ''
            }`}
            title="الصفحة السابقة"
          >
            <ChevronLeft size={20} className="text-gray-600" />
          </button>

          {/* Page numbers */}
          {getPageNumbers().map((page, idx) => {
            if (page === '...') {
              return (
                <span
                  key={`dots-${idx}`}
                  className="flex items-center justify-center w-11 h-11 text-gray-400 font-bold text-lg select-none"
                >
                  ...
                </span>
              );
            }

            const pageNum = page as number;
            const isActive = pageNum === currentPage;

            return (
              <button
                key={`page-${pageNum}`}
                onClick={() => onPageChange(pageNum)}
                className={`flex items-center justify-center w-11 h-11 rounded-lg text-lg font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 border border-blue-600 text-white shadow-sm shadow-blue-200 scale-105'
                    : 'bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 active:bg-gray-100 text-gray-700'
                }`}
              >
                {pageNum}
              </button>
            );
          })}

          {/* Next Page (RTL direction: pointing left) */}
          <button
            onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`flex items-center justify-center w-11 h-11 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 active:bg-gray-100 transition-all cursor-pointer ${
              currentPage === totalPages ? 'opacity-40 cursor-not-allowed hover:bg-white hover:border-gray-200' : ''
            }`}
            title="الصفحة التالية"
          >
            <ChevronRight size={20} className="text-gray-600" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Pagination;
