import { useEffect, useState } from "react";
import { fetchProviders, fetchPayments } from "../services/api.js";
import Sidebar from "../components/Sidebar.jsx";
import MobileHeader from "../components/MobileHeader.jsx";
import PaymentsTable from "./../components/PaymentsTable.jsx";
import PaginationComponent from "../components/PaginationComponent.jsx";

export default function PaymentsPage() {
  const [providers, setProviders] = useState([]);
  const [loadingProviders, setLoadingProviders] = useState(false);

  const [payments, setPayments] = useState([]);
  const [totalPayments, setTotalPayments] = useState(0);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const LIMIT = 10;

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const loadProviders = async () => {
    try {
      setLoadingProviders(true);
      // Fetch all providers for the provider lookup in PaymentsTable
      const data = await fetchProviders(undefined, undefined, true);
      setProviders(data);
    } catch (error) {
      console.error("Error cargando proveedoras:", error);
      setProviders([]);
    } finally {
      setLoadingProviders(false);
    }
  };

  const loadPayments = async (page) => {
    try {
      setLoadingPayments(true);
      const res = await fetchPayments(page, LIMIT);
      setPayments(res.data ?? []);
      setTotalPayments(res.total ?? 0);
    } catch (error) {
      console.error("Error cargando pagos:", error);
      setPayments([]);
      setTotalPayments(0);
    } finally {
      setLoadingPayments(false);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  useEffect(() => {
    loadProviders();
    loadPayments(currentPage);
  }, [currentPage]);

  return (
    <div className="page">
      <Sidebar
        activeView="pagos"
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <main className="page-main">
        <MobileHeader
          eyebrow="Panel"
          title="Pagos"
          onMenuClick={() => setIsSidebarOpen(true)}
        />

        <div className="page-header">
          <div>
            <p className="page-header-eyebrow">Panel</p>
            <h1 className="page-title">Pagos</h1>
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => loadPayments(currentPage)}
            disabled={loadingPayments}
          >
            {loadingPayments ? "Actualizando..." : "Actualizar lista"}
          </button>
        </div>

        <section className="page-section">
          <PaymentsTable
            payments={payments}
            providers={providers}
            loading={loadingPayments || loadingProviders}
            onPaymentsUpdated={loadPayments} // pass refetch function
          />;

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
              {totalPayments === 0
                ? 0
                : (currentPage - 1) * LIMIT + 1}
              {"-"}
              {Math.min(
                currentPage * LIMIT,
                totalPayments
              )} de {totalPayments} pagos
            </p>
          </div>

          <div
            style={{ display: "flex", justifyContent: "center", marginTop: "1rem" }}
          >
            <PaginationComponent
              totalPages={Math.ceil(totalPayments / LIMIT)}
              currentPage={currentPage}
              onChangePage={handlePageChange}
            />
          </div>
        </section>
      </main>
    </div>
  );
}