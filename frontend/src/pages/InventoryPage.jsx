import { useEffect, useMemo, useState, useRef } from "react";
import Sidebar from "../components/Sidebar.jsx";
import SearchBar from "../components/SearchBar.jsx";
import InventoryTable from "../components/InventoryTable.jsx";
import ProvidersTable from "../components/ProvidersTable.jsx";
import DashboardPage from "./DashboardPage.jsx";
import SalesModal from "../components/SalesModal.jsx";
import SalesTable from "../components/SalesTable.jsx";
import PaymentsTable from "../components/PaymentsTable.jsx";
import ProvidersFormModal from "../components/ProvidersFormModal.jsx";
import ItemsFormModal from "../components/ItemsFormModal.jsx";
import { fetchInventory, fetchProvidersComplete, fetchSales, } from "../services/api.js";

function InventoryPage() {
  const [activeView, setActiveView] = useState("dashboard");
  const [inventory, setInventory] = useState([]);
  const [providers, setProviders] = useState([]);
  const [sales, setSales] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingInventory, setLoadingInventory] = useState(true);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [loadingSales, setLoadingSales] = useState(false);
  const [notification, setNotification] = useState("");
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [showProvidersModal, setShowProvidersModal] = useState(false);
  const [dashboardRefresh, setDashboardRefresh] = useState(0);
  const [providersRefresh, setProvidersRefresh] = useState(0);
  const [showItemsModal, setShowItemsModal] = useState(false);
  const inventoryTableRef = useRef(null);

  async function loadInventory() {
    try {
      setLoadingInventory(true);
      const data = await fetchInventory();
      setInventory(data);
    } catch (error) {
      console.error("Error cargando inventario:", error);
      setInventory([]);
    } finally {
      setLoadingInventory(false);
    }
  }

  async function loadProviders() {
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
  }

  async function loadSales() {
    try {
      setLoadingSales(true);
      const data = await fetchSales();
      setSales(data);
    } catch (error) {
      console.error("Error cargando ventas:", error);
      setSales([]);
    } finally {
      setLoadingSales(false);
    }
  }

  useEffect(() => {
    loadProviders();
  }, []);

  useEffect(() => {
    if (activeView === "providers" || activeView === "pagos") {
      loadProviders();
    }

    if (activeView === "inventory" || activeView === "ventas") {
      loadInventory();
    }

    if (activeView === "ventas") {
      loadSales();
    }
  }, [activeView]);

  useEffect(() => {
    if (activeView === "providers") {
      loadProviders();
    }
  }, [providersRefresh, activeView]);

  const handleItemAdded = () => {
    loadInventory();
    setNotification("Item agregado correctamente a la lista.");
    window.setTimeout(() => setNotification(""), 3200);
  };

  const handleAddItem = () => {
    if (inventoryTableRef.current && activeView === "inventory") {
      inventoryTableRef.current.openAddItemModal();

    } else {
      setShowItemsModal(true);
    }

    console.log("Abriendo modal desde InventoryTable");
  };

  const handleAddSale = async () => {
    if (!inventory.length) {
      await loadInventory();
    }
    setShowSaleModal(true);
  };

  const handleProviderAdded = async () => {
    await loadProviders();
    setProvidersRefresh((prev) => prev + 1);
    setDashboardRefresh((prev) => prev + 1);
    setNotification("Proveedora agregada correctamente.");
    window.setTimeout(() => setNotification(""), 3200);
  };

  const handleSaleCreated = () => {
    loadInventory();
    loadSales();
    setNotification("Venta cargada correctamente.");
    window.setTimeout(() => setNotification(""), 3200);
    setDashboardRefresh(prev => prev + 1);
  };

  const filteredInventory = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return inventory;
    }

    return inventory.filter((item) => {
      const codigo = item.codigo.toLowerCase();
      const descripcion = item.descripcion.toLowerCase();
      return codigo.includes(query) || descripcion.includes(query);
    });
  }, [inventory, searchQuery]);

  const filteredProviders = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return providers;
    }

    return providers.filter((provider) => {
      const nombre = `${provider.nombre || ""} ${provider.apellido || ""}`.toLowerCase();
      const telefono = provider.telefono?.toLowerCase() || "";
      const alias = provider.alias?.toLowerCase() || "";
      const cbu = provider.cbu?.toLowerCase() || "";
      return (
        nombre.includes(query) ||
        telefono.includes(query) ||
        alias.includes(query) ||
        cbu.includes(query)
      );
    });
  }, [providers, searchQuery]);

  const filteredSales = useMemo(() => {
    return filteredInventory.filter(
      (item) => item.estado?.toLowerCase() === "vendido",
    );
  }, [filteredInventory]);

  const filteredPayments = useMemo(() => {
    return filteredProviders.filter(
      (item) => item.pago?.toLowerCase() === "pagado",
    );
  }, [filteredProviders]);

  const pageTitle =
    activeView === "inventory"
      ? "Inventario"
      : activeView === "dashboard"
        ? "Dashboard"
        : activeView === "providers"
          ? "Proveedoras"
          : activeView === "ventas"
            ? "Ventas"
            : "Pagos";

  const handleProvidersModalClose = () => {
    setShowProvidersModal(false);
  };

  const handleItemsModalClose = () => {
    setShowItemsModal(false);
  };

  const handleSaleModalClose = () => {
    setShowSaleModal(false);
  };

  const isInventory = activeView === "inventory";
  const isProviders = activeView === "providers";
  const isSales = activeView === "ventas";
  const isPayments = activeView === "pagos";
  const isDashboard = activeView === "dashboard";

  return (
    <div className="layout">
      <Sidebar activeView={activeView} onViewChange={setActiveView} />
      <main className="content">
        <div className="content-header">
          <div>
            <p className="eyebrow">Panel</p>
            <h1>{pageTitle}</h1>
          </div>
        </div>

        <section className="page-panel">
          <div className="controls-row">
            <SearchBar query={searchQuery} onChange={setSearchQuery} />
            {isDashboard && (
              <div className="controls-buttons">
                <button className="secondary-btn" type="button" onClick={handleAddItem}>
                  Agregar producto
                </button>
                <button className="secondary-btn" type="button" onClick={handleAddSale}>
                  Agregar venta
                </button>
                <button className="secondary-btn" type="button" onClick={() => setShowProvidersModal(true)}>
                  Agregar proveedora
                </button>
              </div>
            )}
            {isInventory && (
              <div className="controls-buttons">
                <button
                  className="primary-btn"
                  type="button"
                  onClick={handleAddItem}
                >
                  Agregar producto
                </button>
              </div>
            )}
            {isProviders && (
              <div className="controls-buttons">
                <button
                  className="primary-btn"
                  type="button"
                  onClick={() => setShowProvidersModal(true)}
                >
                  + Nueva Proveedora
                </button>
              </div>
            )}
          </div>
          {notification && (
            <div className="toast-notification">{notification}</div>
          )}
          {isDashboard ? (
            <DashboardPage refresh={dashboardRefresh} />
          ) : isInventory ? (
            <InventoryTable
              ref={inventoryTableRef}
              items={filteredInventory}
              loading={loadingInventory}
              onItemAdded={handleItemAdded}
              providers={providers}
            />
          ) : isSales ? (
            <SalesTable sales={sales} loading={loadingSales} />
          ) : isPayments ? (
            <PaymentsTable
              inventory={filteredInventory}
              providers={providers}
              loading={loadingInventory || loadingProviders}
            />
          ) : (
            <ProvidersTable
              providers={filteredProviders}
              inventoryItems={filteredInventory}
              loading={loadingProviders}
              onDataChange={loadProviders}
            />
          )}
        </section>
      </main>

      <ProvidersFormModal
        isOpen={showProvidersModal}
        onClose={handleProvidersModalClose}
        onProviderAdded={handleProviderAdded}
      />

      <ItemsFormModal
        isOpen={showItemsModal}
        onClose={handleItemsModalClose}
        onItemsAdded={handleItemAdded}
        providers={providers}
        providersRefresh={providersRefresh}
      />

      <SalesModal
        isOpen={showSaleModal}
        onClose={handleSaleModalClose}
        inventoryItems={inventory}
        isLoadingInventory={loadingInventory}
        onSaleCreated={handleSaleCreated}
      />
    </div>
  );
}

export default InventoryPage;
