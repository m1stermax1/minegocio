import { useEffect, useState } from "react";
import {
  fetchProvidersComplete,
   fetchProviderPayments,
} from "../services/api.js";
import Sidebar from "../components/Sidebar.jsx";
import SearchBar from "../components/SearchBar.jsx";

import PaymentsTable from "../components/PaymentsTable.jsx";

import ProvidersFormModal from "../components/ProvidersFormModal.jsx";
import MessageForProvidersModal from "../components/messagesForProvidersModal.jsx";

export default function PaymentsPage({}) {
  const [loading, setLoading] = useState(true);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [providers, setProviders] = useState([]);
  const [pendingProviderPayments, setPendingProviderPayments] = useState([]);
   const [loadingProviders, setLoadingProviders] = useState(false);

    const loadProviders = async () => {
    try {
      setLoadingProviders(true);
      const data = await fetchProvidersComplete();
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
      const data = await fetchProviderPayments();
      setPendingProviderPayments(data);
    } catch (error) {
      console.error("Error cargando pagos pendientes de proveedoras:", error);
      setPendingProviderPayments([]);
    } finally {
      setLoadingPayments(false);
    }
  };

  useEffect(() => {
    loadPendingProviderPayments();
  }, []);

  return (
    <div className="min-h-screen md:grid md:grid-cols-[280px_1fr]">
      <Sidebar activeView="dashboard" />

      <main className="p-8">
        <div>
          <div className="flex items-end justify-between gap-6 mb-7">
            <div>
              <p className="text-accent uppercase tracking-widest text-xs mb-1">
                Panel
              </p>

              <h1 className="text-3xl md:text-4xl m-0">Payments</h1>
            </div>
          </div>

          <section className="bg-slate-800/70 border border-slate-700 rounded-2xl p-7 min-h-[72vh] shadow-soft">
            <PaymentsTable
              payments={pendingProviderPayments}
              providers={providers}
              loading={loadingPayments || loadingProviders}
              onPaymentsUpdated={loadPendingProviderPayments}
            />
          </section>
        </div>
      </main>
    </div>
  );
}
