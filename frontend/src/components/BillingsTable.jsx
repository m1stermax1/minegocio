import { useMemo } from "react";

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

export default function BillingsTable({ invoices = [] }) {
  // If invoices is an object with data and total (from the API), we need to adjust.
  // However, the page now passes invoices as the data array (we set invoices = res.data).
  // So we assume invoices is an array.
  const invoiceList = Array.isArray(invoices) ? invoices : [];

  if (invoiceList.length === 0) {
    return <div className="empty-state">No se encontraron facturas registradas.</div>;
  }

  return (
    <div className="table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Monto</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {invoiceList.map((invoice) => (
            <tr key={invoice.facturaId}>
              <td>{formatDate(invoice.created_at)}</td>
              <td>{formatPrice(invoice.price)}</td>
              <td>
                <span className="badge badge-neutral">
                  {invoice.estadoFactura || "pendiente"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}