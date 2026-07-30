import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import PaginationComponent from "./PaginationComponent.jsx";

describe("PaginationComponent", () => {
  it("no se renderiza si totalPages es 1 o menor", () => {
    const { container } = render(
      <PaginationComponent totalPages={1} currentPage={1} onChangePage={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renderiza exactamente hasta 10 botones de página cuando totalPages > 10", () => {
    render(
      <PaginationComponent totalPages={144} currentPage={1} onChangePage={vi.fn()} />
    );

    // Botones esperados: Anterior, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 144, Siguiente
    expect(screen.getByRole("button", { name: "1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "10" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "11" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "144" })).toBeInTheDocument();
  });

  it("avanza el rango dinámicamente cuando el usuario está en la página 2", () => {
    render(
      <PaginationComponent totalPages={144} currentPage={2} onChangePage={vi.fn()} />
    );

    // En página 2, debe mostrar desde la 2 a la 11, más el botón rápido a la 1 y a la 144
    expect(screen.getByRole("button", { name: "1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "2" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "11" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "12" })).not.toBeInTheDocument();
  });

  it("llama a onChangePage al hacer clic en Siguiente o una página específica", async () => {
    const onChangePage = vi.fn();
    const user = userEvent.setup();

    render(
      <PaginationComponent totalPages={144} currentPage={1} onChangePage={onChangePage} />
    );

    await user.click(screen.getByRole("button", { name: "Siguiente →" }));
    expect(onChangePage).toHaveBeenCalledWith(2);

    await user.click(screen.getByRole("button", { name: "5" }));
    expect(onChangePage).toHaveBeenCalledWith(5);
  });
});
