import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { INSTITUTIONAL_COLORS } from '../constants/colors';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showLabels?: boolean; // Si es true, muestra "Anterior"/"Siguiente", si es false muestra iconos
}

export default function Pagination({ 
  currentPage, 
  totalPages, 
  onPageChange,
  showLabels = false 
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const handlePrevious = () => {
    onPageChange(Math.max(1, currentPage - 1));
  };

  const handleNext = () => {
    onPageChange(Math.min(totalPages, currentPage + 1));
  };

  // Calcular qué números de página mostrar
  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      // Si hay 5 o menos páginas, mostrar todas
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else if (currentPage <= 3) {
      // Si estamos cerca del inicio, mostrar las primeras 5
      for (let i = 1; i <= maxVisible; i++) {
        pages.push(i);
      }
    } else if (currentPage >= totalPages - 2) {
      // Si estamos cerca del final, mostrar las últimas 5
      for (let i = totalPages - 4; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Si estamos en el medio, mostrar 2 antes y 2 después
      for (let i = currentPage - 2; i <= currentPage + 2; i++) {
        pages.push(i);
      }
    }

    return pages;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={handlePrevious}
          disabled={currentPage === 1}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          title="Página anterior"
        >
          {showLabels ? 'Anterior' : <FaChevronLeft />}
        </button>
        
        <div className="flex gap-1">
          {getPageNumbers().map((pageNum) => (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              className={`px-3 py-1.5 text-sm border rounded-md transition-colors ${
                currentPage === pageNum
                  ? `${INSTITUTIONAL_COLORS.bgPrimary} text-white ${INSTITUTIONAL_COLORS.borderPrimary}`
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              {pageNum}
            </button>
          ))}
        </div>
        
        <button
          onClick={handleNext}
          disabled={currentPage === totalPages}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          title="Página siguiente"
        >
          {showLabels ? 'Siguiente' : <FaChevronRight />}
        </button>
      </div>
    </div>
  );
}





