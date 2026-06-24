import React from "react";

const PaginationComponent = ({
  totalPages,
  currentPage,
  onChangePage,
}) => {
  const pages = Array.from(
    { length: totalPages },
    (_, i) => i + 1
  );

  return (
    <div className="flex items-center gap-2 mb-4">
      <button
        onClick={() => onChangePage(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-1 rounded border disabled:opacity-50 disabled:cursor-not-allowed"
      >
        ← Prev
      </button>

      {pages.map((page) => (
        <button
          key={page}
          onClick={() => onChangePage(page)}
          className={`px-3 py-1 rounded border ${
            currentPage === page
              ? "bg-blue-500 text-white"
              : ""
          }`}
        >
          {page}
        </button>
      ))}

      <button
        onClick={() => onChangePage(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3 py-1 rounded border disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Next →
      </button>
    </div>
  );
};

export default PaginationComponent;