import React from "react";

const PaginationComponent = ({ totalPages, currentPage, onChangePage }) => {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  if (totalPages <= 1) return null;

  return (
    <nav
      aria-label="Paginación"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        marginBottom: "1rem",
        flexWrap: "wrap",
      }}
    >
      <button
        type="button"
        onClick={() => onChangePage(currentPage - 1)}
        disabled={currentPage === 1}
        className="btn btn-secondary btn-sm"
      >
        ← Anterior
      </button>

      {pages.map((page) => {
        const isActive = currentPage === page;
        return (
          <button
            key={page}
            type="button"
            onClick={() => onChangePage(page)}
            className={`btn btn-sm ${isActive ? "btn-primary" : "btn-secondary"}`}
            aria-current={isActive ? "page" : undefined}
          >
            {page}
          </button>
        );
      })}

      <button
        type="button"
        onClick={() => onChangePage(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="btn btn-secondary btn-sm"
      >
        Siguiente →
      </button>
    </nav>
  );
};

export default PaginationComponent;