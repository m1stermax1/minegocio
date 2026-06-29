import { useState } from "react";
import Sidebar from "../components/Sidebar.jsx";
import MobileHeader from "../components/MobileHeader.jsx";
import DashboardHeader from "../components/dashboard/DashboardHeader.jsx";
import DashboardActions from "../components/dashboard/DashboardActions.jsx";
import DashboardStats from "../components/dashboard/DashboardStats.jsx";
import DashboardModals from "../components/dashboard/DashboardModals.jsx";
import { useDashboard } from "../hooks/useDashboard.js";

export default function DashboardPage({ refresh }) {
  const {
    loading,
    stats,
    inventory,
    providers,
    loadDashboard,
    loadInventory,
    loadProviders,
  } = useDashboard(refresh);

  const [showItemsModal, setShowItemsModal] = useState(false);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [showProvidersModal, setShowProvidersModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="page">
      <Sidebar
        activeView="dashboard"
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <main className="page-main">
        <MobileHeader
          eyebrow="Panel"
          title="Dashboard"
          onMenuClick={() => setIsSidebarOpen(true)}
        />

        <DashboardHeader />

        <section className="page-section">
          <DashboardActions
            onAddItem={() => setShowItemsModal(true)}
            onAddSale={() => setShowSaleModal(true)}
            onAddProvider={() => setShowProvidersModal(true)}
          />

          {loading ? (
            <div className="table-state">Cargando métricas...</div>
          ) : (
            <DashboardStats stats={stats} />
          )}
        </section>
      </main>

      <DashboardModals
        inventory={inventory}
        providers={providers}
        showProvidersModal={showProvidersModal}
        setShowProvidersModal={setShowProvidersModal}
        showItemsModal={showItemsModal}
        setShowItemsModal={setShowItemsModal}
        showSaleModal={showSaleModal}
        setShowSaleModal={setShowSaleModal}
        onProviderAdded={loadDashboard}
        onItemAdded={() => {
          loadInventory();
          loadDashboard();
        }}
        onSaleCreated={() => {
          loadInventory();
          loadDashboard();
        }}
      />
    </div>
  );
}
