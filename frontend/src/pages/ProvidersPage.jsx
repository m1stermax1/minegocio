import { useEffect, useMemo, useRef, useState } from "react";

import Sidebar from "../components/Sidebar.jsx";
import MobileHeader from "../components/MobileHeader.jsx";
import SearchBar from "../components/SearchBar.jsx";
import InventoryTable from "../components/InventoryTable.jsx";
import ProvidersTable from "../components/ProvidersTable.jsx";
import ProvidersFormModal from "../components/ProvidersFormModal.jsx";

import { fetchInventory, fetchProviders } from "../services/api.js";

function ProvidersPage() {
  const inventoryTableRef = useRef(null);
  const [notification, setNotification] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [inventory, setInventory] = useState([]);
  const [providers, setProviders] = useState([]);
  const [loadingInventory, setLoadingInventory] = useState(true);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [showProvidersModal, setShowProvidersModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const showNotification = (message) => {
    setNotification(message);
    window.setTimeout(() => setNotification(""), 3200);
  };

  const loadProviders = async () => {
    try {
      setLoadingProviders(true);
      const providersList = await fetchProviders();
      setProviders(providersList.data);
    } catch (error) {
      console.error("Error cargando proveedoras:", error);
      setProviders([]);
    } finally {
      setLoadingProviders(false);
    }
  };

  const loadInventory = async () => {
    try {
      setLoadingInventory(true);
      const data = await fetchInventory();
      setInventory(data?.data);
    } catch (error) {
      console.error("Error cargando inventario:", error);
      setInventory([]);
    } finally {
      setLoadingInventory(false);
    }
  };

  useEffect(() => {
    loadProviders();
    loadInventory();
  }, []);

  const handleProviderAdded = async () => {
    await loadProviders();
    showNotification("Proveedora agregada correctamente.");
  };

  const handleDataChange = async () => {
    await loadProviders();
    await loadInventory();
  };

  const filteredInventory = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return inventory;
    return inventory.filter(({ codigo, descripcion }) =>
      codigo?.toLowerCase().includes(query) ||
      descripcion?.toLowerCase().includes(query),
    );
  }, [inventory, searchQuery]);

  const filteredProviders = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return providers;
    return providers.filter((provider) => {
      const nombre = `${provider.nombre || ""} ${provider.apellido || ""}`.toLowerCase();
      return (
        nombre.includes(query) ||
        provider.telefono?.toLowerCase().includes(query) ||
        provider.alias?.toLowerCase().includes(query) ||
        provider.cbu?.toLowerCase().includes(query)
      );
    });
  }, [providers, searchQuery]);

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
            <SearchBar />
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setShowProvidersModal(true)}
            >
              Agregar proveedora
            </button>
          </div>

          {notification && <div className="toast-notification">{notification}</div>}

          <ProvidersTable
            providers={providers}
            inventoryItems={filteredInventory}
            loading={loadingProviders}
            onDataChange={handleDataChange}
          />
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
