import { MdChevronLeft, MdChevronRight } from 'react-icons/md';

const Pagination = ({ pagination, onPageChange }) => {
  if (!pagination || pagination.totalPages <= 1) return null;

  const { page, totalPages, total } = pagination;

  const pages = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return (
    <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-100">
      <p className="text-xs text-gray-400 font-medium">
        Page {page} of {totalPages} &middot; {total} records
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <MdChevronLeft className="text-xl text-gray-500" />
        </button>
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all ${
              p === page
                ? 'bg-primary-600 text-white shadow-sm'
                : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            {p}
          </button>
        ))}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <MdChevronRight className="text-xl text-gray-500" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
