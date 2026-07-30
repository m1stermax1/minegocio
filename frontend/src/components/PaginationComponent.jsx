import React from "react";

const PaginationComponent = ({ totalPages, currentPage, onChangePage }) => {
  if (totalPages <= 1) return null;

  const MAX_VISIBLE = 10;

  // La ventana arranca desde currentPage, pero si se pasa del final, retrocede
  let startPage = currentPage;
  let endPage = startPage + MAX_VISIBLE - 1;

  if (endPage > totalPages) {
    endPage = totalPages;
    startPage = Math.max(1, endPage - MAX_VISIBLE + 1);
  }

  const pages = [];
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  const showFirstJump = startPage > 1;
  const showLastJump  = endPage < totalPages;

  return (
    <nav
      aria-label="Paginación"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.375rem",
        marginBottom: "1rem",
        flexWrap: "wrap",
        justifyContent: "center",
      }}
    >
      {/* ← Primera */}
      <button
        type="button"
        onClick={() => onChangePage(1)}
        disabled={currentPage === 1}
        className="btn btn-secondary btn-sm"
        aria-label="Primera página"
      >
        «
      </button>

      {/* ← Anterior */}
      <button
        type="button"
        onClick={() => onChangePage(currentPage - 1)}
        disabled={currentPage === 1}
        className="btn btn-secondary btn-sm"
        aria-label="Página anterior"
      >
        ‹ Ant
      </button>

      {/* Acceso rápido a página 1 si la ventana no empieza ahí */}
      {showFirstJump && (
        <>
          <button
            type="button"
            onClick={() => onChangePage(1)}
            className="btn btn-secondary btn-sm"
          >
            1
          </button>
          {startPage > 2 && (
            <span style={{ color: "var(--text-muted)", padding: "0 0.125rem", fontSize: "0.9rem", lineHeight: 1 }}>
              …
            </span>
          )}
        </>
      )}

      {/* Páginas visibles (ventana de 10) */}
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

      {/* Acceso rápido a última página si la ventana no llega */}
      {showLastJump && (
        <>
          {endPage < totalPages - 1 && (
            <span style={{ color: "var(--text-muted)", padding: "0 0.125rem", fontSize: "0.9rem", lineHeight: 1 }}>
              …
            </span>
          )}
          <button
            type="button"
            onClick={() => onChangePage(totalPages)}
            className="btn btn-secondary btn-sm"
          >
            {totalPages}
          </button>
        </>
      )}

      {/* Siguiente → */}
      <button
        type="button"
        onClick={() => onChangePage(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="btn btn-secondary btn-sm"
        aria-label="Página siguiente"
      >
        Sig ›
      </button>

      {/* Última → */}
      <button
        type="button"
        onClick={() => onChangePage(totalPages)}
        disabled={currentPage === totalPages}
        className="btn btn-secondary btn-sm"
        aria-label="Última página"
      >
        »
      </button>
    </nav>
  );
};

export default PaginationComponent;