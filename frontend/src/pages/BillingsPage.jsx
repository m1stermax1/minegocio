import { useEffect, useState } from "react";
import { fetchInvoices } from "../services/api.js";
import Sidebar from "../components/Sidebar.jsx";
import MobileHeader from "../components/MobileHeader.jsx";
import BillingsTable from "./../components/BillingsTable.jsx";
import PaginationComponent from "../components/PaginationComponent.jsx";

export default function BillingsPage() {
  const [invoices, setInvoices] = useState([]);
  const [totalInvoices, setTotalInvoices] = useState(0);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const LIMIT = 10;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const loadInvoices = async (page) => {
    try {
      setLoading(true);
      const res = await fetchInvoices(page, LIMIT);
      setInvoices(res.data ?? []);
      setTotalInvoices(res.total ?? 0);
    } catch (err) {
      console.error("Error cargando facturas:", err);
      setInvoices([]);
      setTotalInvoices(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices(currentPage);
  }, [currentPage]);

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
            onClick={() => loadInvoices(currentPage)}
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

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            marginTop: "1rem",
          }}
        >
          <p>
            Mostrando{" "}
            {totalInvoices === 0
              ? 0
              : (currentPage - 1) * LIMIT + 1}
            {"-"}
            {Math.min(
              currentPage * LIMIT,
              totalInvoices
            )} de {totalInvoices} facturas
          </p>
        </div>

        <div
          style={{ display: "flex", justifyContent: "center", marginTop: "1rem" }}
        >
          <PaginationComponent
            totalPages={Math.ceil(totalInvoices / LIMIT)}
            currentPage={currentPage}
            onChangePage={setCurrentPage}
          />
        </div>
      </main>
    </div>
  );
}