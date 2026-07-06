import { useMemo, useState } from "react";

const formatPrice = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return "-";
  return `$ ${number.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

const formatDate = (dateStr) => {
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

const normalizeInvoiceStatus = (value) => {
  const raw = String(value ?? "").trim().toUpperCase();
  if (["OK", "FACTURADO", "FACTURADA", "APROBADO"].includes(raw)) {
    return "OK";
  }
  if (["PENDING", "PENDIENTE"].includes(raw)) {
    return "PENDING";
  }
  return raw || "PENDING";
};

const normalizeDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

export default function BillingsTable({ invoices = [] }) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const invoiceList = Array.isArray(invoices) ? invoices : [];

  const filteredInvoices = useMemo(() => {
    const start = normalizeDate(startDate);
    const end = normalizeDate(endDate);

    return invoiceList.filter((invoice) => {
      const invoiceDate = normalizeDate(invoice.created_at || invoice.fecha || invoice.date);
      const status = normalizeInvoiceStatus(invoice.estadoFactura || invoice.status);

      if (statusFilter !== "ALL" && status !== statusFilter) {
        return false;
      }

      if (start && invoiceDate && invoiceDate < start) {
        return false;
      }

      if (end && invoiceDate && invoiceDate > end) {
        return false;
      }

      return true;
    });
  }, [invoiceList, startDate, endDate, statusFilter]);

  const clearFilters = () => {
    setStartDate("");
    setEndDate("");
    setStatusFilter("ALL");
  };

  return (
    <div className="table-wrapper">
      <div style={{ display: "grid", gap: "0.75rem", marginBottom: "1rem", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
        <div>
          <label className="label" htmlFor="billing-start-date">Desde</label>
          <input
            id="billing-start-date"
            type="date"
            className="input"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="billing-end-date">Hasta</label>
          <input
            id="billing-end-date"
            type="date"
            className="input"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="billing-status-filter">Estado</label>
          <select
            id="billing-status-filter"
            className="input"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="ALL">Todos</option>
            <option value="PENDING">PENDING</option>
            <option value="OK">OK</option>
          </select>
        </div>
        <div style={{ display: "flex", alignItems: "end" }}>
          <button type="button" className="btn btn-secondary" onClick={clearFilters}>
            Limpiar filtros
          </button>
        </div>
      </div>

      {filteredInvoices.length === 0 ? (
        <div className="empty-state">No se encontraron facturas registradas.</div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Monto</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.map((invoice) => {
              const status = normalizeInvoiceStatus(invoice.estadoFactura || invoice.status);
              return (
                <tr key={invoice.facturaId || invoice.id}>
                  <td>{formatDate(invoice.created_at || invoice.fecha || invoice.date)}</td>
                  <td>{formatPrice(invoice.price || invoice.montoTotal || invoice.amount)}</td>
                  <td>
                    <span className="badge badge-neutral">
                      {status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}