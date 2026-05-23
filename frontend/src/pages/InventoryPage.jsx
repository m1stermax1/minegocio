import { useEffect, useMemo, useState, useRef } from "react";
import Sidebar from "../components/Sidebar.jsx";
import SearchBar from "../components/SearchBar.jsx";
import InventoryTable from "../components/InventoryTable.jsx";
import ProvidersTable from "../components/ProvidersTable.jsx";
import DashboardPage from "./DashboardPage.jsx";
import { fetchInventory, fetchProviders } from "../services/api.js";

function InventoryPage() {
  const [activeView, setActiveView] = useState("inventory");
  const [inventory, setInventory] = useState([]);
  const [providers, setProviders] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingInventory, setLoadingInventory] = useState(true);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [notification, setNotification] = useState("");
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
      const data = await fetchProviders();
      setProviders(data);
    } catch (error) {
      console.error("Error cargando proveedoras:", error);
      setProviders([]);
    } finally {
      setLoadingProviders(false);
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
  }, [activeView]);

  const handleItemAdded = () => {
    loadInventory();
    setNotification("Item agregado correctamente a la lista.");
    window.setTimeout(() => setNotification(""), 3200);
  };

  const handleAddItem = () => {
    if (inventoryTableRef.current) {
      inventoryTableRef.current.openAddItemModal();
    }
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

    return providers.filter((item) => {
      const codigo = item.codigo?.toLowerCase() || "";
      const nombre = item.nombre?.toLowerCase() || "";
      const descripcion = item.descripcion?.toLowerCase() || "";
      const precio = item.precio?.toString().toLowerCase() || "";
      const estado = item.estado?.toLowerCase() || "";
      const pago = item.pago?.toLowerCase() || "";
      return (
        codigo.includes(query) ||
        nombre.includes(query) ||
        descripcion.includes(query) ||
        precio.includes(query) ||
        estado.includes(query) ||
        pago.includes(query)
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

  const [showProvidersModal, setShowProvidersModal] = useState(false);
    const handleProvidersModalClose = () => {
    setShowProvidersModal(false);
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
            {isInventory && (
              <div className="controls-buttons">
                <button
                  className="primary-btn"
                  type="button"
                  onClick={handleAddItem}
                >
                  Agregar producto
                </button>
                {/* <button
                  className="bulk-action-btn"
                  disabled={!inventoryTableRef.current?.getSelectedCount?.()}
                >
                  Acción masiva
                </button> */}
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
            <DashboardPage />
          ) : isInventory ? (
            <InventoryTable
              ref={inventoryTableRef}
              items={filteredInventory}
              loading={loadingInventory}
              onItemAdded={handleItemAdded}
              providers={providers}
            />
          ) : isSales ? (
            <InventoryTable
              items={filteredSales}
              loading={loadingInventory}
              providers={providers}
              showSelection={false}
            />
          ) : isPayments ? (
            <InventoryTable
              items={filteredPayments.map((item) => ({
                ...item,
                proveedora: item.nombre,
              }))}
              loading={loadingProviders}
              showSelection={false}
            />
          ) : (
            <ProvidersTable
              items={filteredProviders}
              loading={loadingProviders}
              onDataChange={loadProviders}
            />
          )}
        </section>
      </main>
    </div>
  );
}

export default InventoryPage;
