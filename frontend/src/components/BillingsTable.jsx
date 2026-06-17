import { useEffect, useState } from "react";
import { fetchInvoices, issueInvoice } from "../services/api.js";

const formatPrice = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return "-";
  }
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

export default function BillingsTable() {
  const [loading, setLoading] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [error, setError] = useState("");
  console.log("Lista en la tabla", invoices)
  const loadInvoices = async () => {
    try {
      const list = await fetchInvoices();
      setInvoices(list?.data)
    } catch (err) {
      console.log(err)
    }
  }

  useEffect(() => {
    loadInvoices()
  }, [])

  console.log("Lista:", invoices)
  return (
    <>
      <table className="w-full min-w-[860px] border-separate border-spacing-3">
        <thead>
          <tr>
            <th className="text-center">Fecha</th>
            <th className="text-center">Monto</th>
            <th className="text-center">Estado</th>
            <th className="text-center">Acción</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((invoice) => (
            <tr
              key={invoice.facturaId}
              className="odd:bg-slate-900/30 even:bg-slate-900/20"
            >
              <td className="text-center text-sm">
                {formatDate(invoice.created_at)}
              </td>
              <td className="text-center">{formatPrice(invoice.price)}</td>
              {/* <td className="text-center">
                <button
                  type="button"
                  className={`rounded-lg px-3 py-2 text-sm ${invoice.estadoFactura === "facturada" ? "bg-slate-700 text-slate-300 cursor-not-allowed" : "bg-accent text-slate-900"}`}
                  onClick={() => handleIssueInvoice(invoice.id)}
                  disabled={
                    invoice.estadoFactura === "facturada"
                  }
                >
                  {invoice.estadoFactura === "facturada"
                    ? "Facturada"
                    : issuingId === invoice.facturaId
                      ? "Facturando..."
                      : "Facturar"}
                </button>
              </td> */}
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
