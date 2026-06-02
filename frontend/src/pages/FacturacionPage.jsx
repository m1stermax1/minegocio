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
    return date.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch {
    return dateStr;
  }
};

export default function FacturacionPage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [issuingId, setIssuingId] = useState(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const loadInvoices = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchInvoices();
      setInvoices(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error cargando facturas:", err);
      setError(err.response?.data?.error || "No se pudieron cargar las facturas.");
    } finally {
      setLoading(false);
    }
  };

  const handleIssueInvoice = async (facturaId) => {
    setIssuingId(facturaId);
    setError("");
    setSuccessMessage("");

    try {
      const result = await issueInvoice(facturaId);
      setSuccessMessage(`Factura ${facturaId} facturada correctamente.`);
      console.log(result);
      await loadInvoices();
    } catch (err) {
      console.error("Error facturando:", err);
      setError(err.response?.data?.error || "No se pudo facturar esta venta.");
    } finally {
      setIssuingId(null);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  if (loading) {
    return <div className="table-state">Cargando facturas...</div>;
  }

  if (!invoices.length) {
    return <div className="table-state">No se encontraron facturas registradas.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <div className="mb-5 grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-sm text-slate-400">Facturas cargadas: {invoices.length}</p>
        </div>
        <div className="sm:col-span-3 text-right">
          <button
            type="button"
            className="bg-accent text-slate-900 rounded-lg px-4 py-2"
            onClick={loadInvoices}
          >
            Actualizar lista
          </button>
        </div>
      </div>

      {error && <div className="text-rose-300 bg-rose-900/20 border border-rose-800 rounded-md p-3 mb-4">{error}</div>}
      {successMessage && <div className="text-emerald-300 bg-emerald-900/20 border border-emerald-800 rounded-md p-3 mb-4">{successMessage}</div>}

      <table className="w-full min-w-[860px] border-separate border-spacing-3">
        <thead>
          <tr>
            <th className="text-center">Fecha</th>
            <th className="text-center">Producto</th>
            <th className="text-center">Monto</th>
            <th className="text-center">Método</th>
            <th className="text-center">Estado</th>
            <th className="text-center">Factura</th>
            <th className="text-center">Acción</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((invoice) => (
            <tr key={invoice.facturaId} className="odd:bg-slate-900/30 even:bg-slate-900/20">
              <td className="text-center text-sm">{formatDate(invoice.fecha)}</td>
              <td className="text-center">{invoice.producto || "-"}</td>
              <td className="text-center">{formatPrice(invoice.montoTotal)}</td>
              <td className="text-center">{invoice.metodoPago || "-"}</td>
              <td className="text-center">{invoice.estadoFactura || "pendiente"}</td>
              <td className="text-center">{invoice.comprobante || "-"}</td>
              <td className="text-center">
                <button
                  type="button"
                  className={`rounded-lg px-3 py-2 text-sm ${invoice.estadoFactura === "facturada" ? "bg-slate-700 text-slate-300 cursor-not-allowed" : "bg-accent text-slate-900"}`}
                  onClick={() => handleIssueInvoice(invoice.facturaId)}
                  disabled={invoice.estadoFactura === "facturada" || issuingId === invoice.facturaId}
                >
                  {invoice.estadoFactura === "facturada" ? "Facturada" : issuingId === invoice.facturaId ? "Facturando..." : "Facturar"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
