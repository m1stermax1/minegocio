import { Fragment, useState, useMemo } from "react";

export default function SalesTable({ sales = [], salesItems = [] }) {
  const [expandedSale, setExpandedSale] = useState(null);
  const [dateFilter, setDateFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const toggleExpanded = (index) => {
    setExpandedSale((prev) => (prev === index ? null : index));
  };

  const formatDateArg = (dateStr) => {
    if (!dateStr) return "-";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const filteredSales = useMemo(() => {
    return sales?.data?.filter((sale) => {
      const saleDate = sale?.sale_date?.split("T")[0];
      if (!saleDate) return true;
      if (dateFilter) return saleDate === dateFilter;
      if (dateFrom && saleDate < dateFrom) return false;
      if (dateTo && saleDate > dateTo) return false;
      return true;
    });
  }, [sales, dateFilter, dateFrom, dateTo]);

  const filteredSalesById = (id) =>
    salesItems?.filter((item) => item?.sale_id == id);

  const clearFilters = () => {
    setDateFilter("");
    setDateFrom("");
    setDateTo("");
  };

  if (!sales?.data?.length) {
    return <div className="empty-state">No se encontraron ventas.</div>;
  }

  const hasFilters = dateFilter || dateFrom || dateTo;

  return (
    <div className="table-wrapper">
      <div
        style={{
          display: "grid",
          gap: "1rem",
          gridTemplateColumns: "1fr 1fr 1fr max-content",
          marginBottom: "1rem",
          alignItems: "end",
        }}
      >
        <div>
          <label className="label-muted">Filtrar por fecha</label>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value);
              setDateFrom("");
              setDateTo("");
            }}
            className="input"
          />
        </div>
        <div>
          <label className="label-muted">Desde</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setDateFilter("");
            }}
            className="input"
          />
        </div>
        <div>
          <label className="label-muted">Hasta</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setDateFilter("");
            }}
            className="input"
          />
        </div>
        {hasFilters && (
          <button type="button" className="btn btn-secondary" onClick={clearFilters}>
            Limpiar filtros
          </button>
        )}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem",
        }}
      >
        <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.875rem" }}>
          Mostrando {filteredSales?.length ?? 0} de {sales.length} ventas
        </p>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Método</th>
            <th>Total</th>
            <th>Productos</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {filteredSales.map((sale, index) => (
            <Fragment key={`sale-${index}`}>
              <tr>
                <td style={{ fontWeight: 500 }}>{formatDateArg(sale.sale_date)}</td>
                <td>{sale.payment_method || "-"}</td>
                <td>
                  $
                  {Number(sale.amount || 0).toLocaleString("es-AR", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                  })}
                </td>
                <td>{filteredSalesById(sale?.id)?.length ?? 0}</td>
                <td>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => toggleExpanded(index)}
                  >
                    {expandedSale === index ? "Ocultar" : "Ver productos"}
                  </button>
                </td>
              </tr>
              {expandedSale === index && (
                <tr>
                  <td colSpan={5}>
                    <div style={{ padding: "0.75rem 0" }}>
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th className="text-start">Código</th>
                            <th>Descripción</th>
                            <th>Precio</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredSalesById(sale?.id)?.map((item, itemIndex) => (
                            <tr key={`${index}-${itemIndex}`}>
                              <td className="text-start">{item.id || "-"}</td>
                              <td>{item.description || "-"}</td>
                              <td>
                                $
                                {Number(item.unit_price || 0).toLocaleString("es-AR", {
                                  minimumFractionDigits: 0,
                                  maximumFractionDigits: 2,
                                })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}