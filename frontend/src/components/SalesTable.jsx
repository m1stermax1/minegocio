import { Fragment, useState, useMemo } from "react";

export default function SalesTable({ sales = [], loading }) {
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
      return date.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
    } catch {
      return dateStr;
    }
  };

  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      const saleDate = sale.fecha ? new Date(sale.fecha) : null;
      if (!saleDate) return true;

      if (dateFilter) {
        const filterDate = new Date(dateFilter);
        return saleDate.toDateString() === filterDate.toDateString();
      }

      if (dateFrom) {
        const fromDate = new Date(dateFrom);
        if (saleDate < fromDate) return false;
      }

      if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59);
        if (saleDate > toDate) return false;
      }

      return true;
    });
  }, [sales, dateFilter, dateFrom, dateTo]);

  if (loading) {
    return <div className="table-state">Cargando ventas...</div>;
  }

  if (!sales.length) {
    return <div className="table-state">No se encontraron ventas.</div>;
  }

  return (
    <div className="table-wrapper">
      <div style={{ marginBottom: "20px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" }}>
        <div>
          <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "6px", fontWeight: 600, color: "var(--accent)" }}>Filtrar por fecha</label>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value);
              setDateFrom("");
              setDateTo("");
            }}
            style={{
              width: "100%",
              padding: "8px 12px",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              backgroundColor: "var(--surface)",
              color: "var(--text)",
              fontSize: "0.9rem"
            }}
          />
        </div>
        <div>
          <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "6px", fontWeight: 600, color: "var(--accent)" }}>Desde</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setDateFilter("");
            }}
            style={{
              width: "100%",
              padding: "8px 12px",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              backgroundColor: "var(--surface)",
              color: "var(--text)",
              fontSize: "0.9rem"
            }}
          />
        </div>
        <div>
          <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "6px", fontWeight: 600, color: "var(--accent)" }}>Hasta</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setDateFilter("");
            }}
            style={{
              width: "100%",
              padding: "8px 12px",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              backgroundColor: "var(--surface)",
              color: "var(--text)",
              fontSize: "0.9rem"
            }}
          />
        </div>
        {(dateFilter || dateFrom || dateTo) && (
          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <button
              type="button"
              className="secondary-btn"
              onClick={() => {
                setDateFilter("");
                setDateFrom("");
                setDateTo("");
              }}
              style={{ width: "100%" }}
            >
              Limpiar filtros
            </button>
          </div>
        )}
      </div>
      <div style={{ marginBottom: "12px", fontSize: "0.9rem", color: "var(--muted)" }}>
        Mostrando {filteredSales.length} de {sales.length} ventas
      </div>
      <table className="inventory-table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Método</th>
            <th>Total</th>
            <th>Productos</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {filteredSales.map((sale, index) => (
            <Fragment key={`sale-${index}`}>
              <tr>
                <td style={{ fontSize: "0.9rem", fontWeight: 500 }}>{formatDateArg(sale.fecha)}</td>
                <td>{sale.metodoPago || "-"}</td>
                <td>${Number(sale.montoTotal || 0).toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</td>
                <td>{sale.items?.length || 0}</td>
                <td>
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() => toggleExpanded(index)}
                  >
                    {expandedSale === index ? "Ocultar" : "Ver productos"}
                  </button>
                </td>
              </tr>
              {expandedSale === index && (
                <tr>
                  <td colSpan={5}>
                    <div className="provider-items-table-wrapper" style={{ padding: "12px 0" }}>
                      <table className="inventory-table">
                        <thead>
                          <tr>
                            <th>Código</th>
                            <th>Descripción</th>
                            <th>Proveedor</th>
                            <th>Precio</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sale.items?.map((item, itemIndex) => (
                            <tr key={`${index}-${itemIndex}`}>
                              <td>{item.codigo || "-"}</td>
                              <td>{item.descripcion || "-"}</td>
                              <td>{item.proveedora || "-"}</td>
                              <td>${Number(item.precio || 0).toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</td>
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