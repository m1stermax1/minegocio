import { useEffect, useState } from "react";
import { fetchInvoices } from "../services/api.js";

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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Si no se pasan invoices, los podríamos cargar aquí; el page ya lo hace.
    setLoading(false);
  }, [invoices]);

  if (!invoices?.length) {
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
          {invoices.map((invoice) => (
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