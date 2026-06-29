import { useEffect, useState } from "react";
import { fetchInvoices } from "../services/api.js";
import Sidebar from "../components/Sidebar.jsx";
import MobileHeader from "../components/MobileHeader.jsx";
import BillingsTable from "../components/BillingsTable.jsx";

export default function BillingsPage() {
  const [loading, setLoading] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const list = await fetchInvoices();
      setInvoices(list?.data ?? []);
    } catch (err) {
      console.error("Error cargando facturas:", err);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  return (
    <div className="page">
      <Sidebar
        activeView="facturacion"
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <main className="page-main">
        <MobileHeader
          eyebrow="Panel"
          title="Facturas"
          onMenuClick={() => setIsSidebarOpen(true)}
        />

        <div className="page-header">
          <div>
            <p className="page-header-eyebrow">Panel</p>
            <h1 className="page-title">Facturas</h1>
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={loadInvoices}
            disabled={loading}
          >
            {loading ? "Actualizando..." : "Actualizar lista"}
          </button>
        </div>

        <section className="page-section">
          {loading ? (
            <div className="table-state">Cargando facturas...</div>
          ) : (
            <BillingsTable invoices={invoices} />
          )}
        </section>
      </main>
    </div>
  );
}