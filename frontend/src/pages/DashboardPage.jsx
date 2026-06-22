import { useState } from "react";

import Sidebar from "../components/Sidebar";

import DashboardHeader from "../components/dashboard/DashboardHeader.jsx";
import DashboardActions from "../components/dashboard/DashboardActions.jsx";
import DashboardStats from "../components/dashboard/DashboardStats.jsx";
import DashboardModals from "../components/dashboard/DashboardModals.jsx";

import { useDashboard } from "../hooks/useDashboard.js";

export default function DashboardPage({
  refresh,
}) {
  const {
    loading,
    stats,
    inventory,
    providers,
    loadDashboard,
    loadInventory,
    loadProviders,
  } = useDashboard(refresh);

  const [showItemsModal, setShowItemsModal] =
    useState(false);

  const [showSaleModal, setShowSaleModal] =
    useState(false);

  const [
    showProvidersModal,
    setShowProvidersModal,
  ] = useState(false);

  return (
    <div className="min-h-screen md:grid md:grid-cols-[280px_1fr]">
      <Sidebar activeView="dashboard" />

      <main className="p-8">
        <DashboardHeader />

        <section className="bg-slate-800/70 border border-slate-700 rounded-2xl p-7 min-h-[72vh] shadow-soft">

          <DashboardActions
            onAddItem={() =>
              setShowItemsModal(true)
            }
            onAddSale={() =>
              setShowSaleModal(true)
            }
            onAddProvider={() =>
              setShowProvidersModal(true)
            }
          />

          {loading ? (
            <p>Cargando...</p>
          ) : (
            <DashboardStats stats={stats} />
          )}
        </section>
      </main>

      <DashboardModals
        inventory={inventory}
        providers={providers}
        showProvidersModal={showProvidersModal}
        setShowProvidersModal={
          setShowProvidersModal
        }
        showItemsModal={showItemsModal}
        setShowItemsModal={
          setShowItemsModal
        }
        showSaleModal={showSaleModal}
        setShowSaleModal={setShowSaleModal}
        onProviderAdded={loadDashboard}
        onItemAdded={loadInventory}
        onSaleCreated={() => {
          loadInventory();
          loadDashboard();
        }}
      />
    </div>
  );
}