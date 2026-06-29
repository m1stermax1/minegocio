import { useEffect, useState } from "react";
import { fetchProviders, fetchPayments } from "../services/api.js";
import Sidebar from "../components/Sidebar.jsx";
import MobileHeader from "../components/MobileHeader.jsx";
import PaymentsTable from "../components/PaymentsTable.jsx";

export default function PaymentsPage() {
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [providers, setProviders] = useState([]);
  const [pendingProviderPayments, setPendingProviderPayments] = useState([]);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const loadProviders = async () => {
    try {
      setLoadingProviders(true);
      const data = await fetchProviders();
      setProviders(data);
    } catch (error) {
      console.error("Error cargando proveedoras:", error);
      setProviders([]);
    } finally {
      setLoadingProviders(false);
    }
  };

  const loadPendingProviderPayments = async () => {
    try {
      setLoadingPayments(true);
      const data = await fetchPayments();
      setPendingProviderPayments(data?.data);
    } catch (error) {
      console.error("Error cargando pagos pendientes de proveedoras:", error);
      setPendingProviderPayments([]);
    } finally {
      setLoadingPayments(false);
    }
  };

  useEffect(() => {
    loadPendingProviderPayments();
    loadProviders();
  }, []);

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
        </div>

        <section className="page-section">
          <PaymentsTable
            payments={pendingProviderPayments}
            providers={providers}
            loading={loadingPayments || loadingProviders}
            onPaymentsUpdated={loadPendingProviderPayments}
          />
        </section>
      </main>
    </div>
  );
}