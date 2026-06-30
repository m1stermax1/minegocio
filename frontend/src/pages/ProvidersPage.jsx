import { useEffect, useState } from "react";

import Sidebar from "../components/Sidebar.jsx";
import MobileHeader from "../components/MobileHeader.jsx";
import ProvidersTable from "../components/ProvidersTable.jsx";
import ProvidersFormModal from "./../components/ProvidersFormModal.jsx";
import InventoryTable from "../components/InventoryTable.jsx"; // maybe not needed
import { fetchProviders, fetchInventory } from "../services/api.js";
import PaginationComponent from "../components/PaginationComponent.jsx";

function ProvidersPage() {
  const [providers, setProviders] = useState([]);
  const [totalProviders, setTotalProviders] = useState(0);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const LIMIT = 10;

  const [inventory, setInventory] = useState([]);
  const [loadingInventory, setLoadingInventory] = useState(true);

  const [showProvidersModal, setShowProvidersModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const loadProviders = async (page) => {
    try {
      setLoadingProviders(true);
      const res = await fetchProviders(page, LIMIT);
      setProviders(res.data ?? []);
      setTotalProviders(res.total ?? 0);
    } catch (error) {
      console.error("Error cargando proveedoras:", error);
      setProviders([]);
      setTotalProviders(0);
    } finally {
      setLoadingProviders(false);
    }
  };

  const loadInventory = async () => {
    try {
      setLoadingInventory(true);
      const data = await fetchInventory(); // no pagination needed for modal
      setInventory(data?.data ?? []);
    } catch (error) {
      console.error("Error cargando inventario:", error);
      setInventory([]);
    } finally {
      setLoadingInventory(false);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  useEffect(() => {
    loadProviders(currentPage);
    loadInventory();
  }, [currentPage]);

  const handleProviderAdded = async () => {
    await loadProviders(currentPage); // refresh after add
    alert("Proveedora agregada correctamente.");
  };

  const handleDataChange = () => {
    loadProviders(currentPage);
  };

  return (
    <div className="page">
      <Sidebar
        activeView="providers"
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <main className="page-main">
        <MobileHeader
          eyebrow="Panel"
          title="Proveedores"
          onMenuClick={() => setIsSidebarOpen(true)}
        />

        <div className="page-header">
          <div>
            <p className="page-header-eyebrow">Panel</p>
            <h1 className="page-title">Proveedores</h1>
          </div>
        </div>

        <section className="page-section">
          <div className="inventory-filters grid grid-cols-1 md:grid-cols-[1fr_max-content] gap-4 items-center mb-6">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setShowProvidersModal(true)}
            >
              Agregar proveedora
            </button>
          </div>

          <ProvidersTable
            providers={providers}
            loading={loadingProviders}
            onDataChange={handleDataChange}
          />

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
              {totalProviders === 0
                ? 0
                : (currentPage - 1) * LIMIT + 1}
              {"-"}
              {Math.min(
                currentPage * LIMIT,
                totalProviders
              )} de {totalProviders} proveedoras
            </p>
          </div>

          <div
            style={{ display: "flex", justifyContent: "center", marginTop: "1rem" }}
          >
            <PaginationComponent
              totalPages={Math.ceil(totalProviders / LIMIT)}
              currentPage={currentPage}
              onChangePage={handlePageChange}
            />
          </div>
        </section>
      </main>

      <ProvidersFormModal
        isOpen={showProvidersModal}
        onClose={() => setShowProvidersModal(false)}
        onProviderAdded={handleProviderAdded}
        inventoryItems={inventory}
      />
    </div>
  );
}

export default ProvidersPage;