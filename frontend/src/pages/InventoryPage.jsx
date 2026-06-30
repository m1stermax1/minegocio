import { useEffect, useMemo, useRef, useState } from "react";

import Sidebar from "../components/Sidebar.jsx";
import MobileHeader from "../components/MobileHeader.jsx";
import SearchBar from "../components/SearchBar.jsx";
import InventoryTable from "../components/InventoryTable.jsx";
import ItemsFormModal from "../components/ItemsFormModal.jsx";
import PaginationComponent from "../components/PaginationComponent.jsx";

import { fetchInventory, fetchProviders } from "../services/api.js";

function InventoryPage() {
  const inventoryTableRef = useRef(null);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [totalInventory, setTotalInventory] = useState(0);
  const [providers, setProviders] = useState([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [notification, setNotification] = useState("");

  const [providersRefresh, setProvidersRefresh] = useState(0);

  const [loadingInventory, setLoadingInventory] = useState(true);
  const [loadingProviders, setLoadingProviders] = useState(false);

  const [showItemsModal, setShowItemsModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const LIMIT = 10;
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedProvider, setSelectedProvider] = useState("");

  const showNotification = (message) => {
    setNotification(message);
    window.setTimeout(() => setNotification(""), 3200);
  };

  const loadInventory = async (page, limit, selectedProvider) => {
    try {
      setLoadingInventory(true);
      const res = await fetchInventory(page, limit, selectedProvider);
      setInventoryItems(res.data?.data ?? []);
      setTotalInventory(res.total ?? 0);
    } catch (error) {
      console.error("Error cargando inventario:", error);
      setInventoryItems([]);
      setTotalInventory(0);
    } finally {
      setLoadingInventory(false);
    }
  };

  const loadProviders = async (page, limit,) => {
    try {
      setLoadingProviders(true);
      // Fetch all providers for the filter dropdown
      const data = await fetchProviders(page, limit, true);
      console.log("prov", providers)
      setProviders(data);
    } catch (error) {
      console.error("Error cargando proveedoras:", error);
      setProviders([]);
    } finally {
      setLoadingProviders(false);
    }
  };

  useEffect(() => {
    loadProviders();
    loadInventory(currentPage, LIMIT, selectedProvider);
  }, [currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedProvider]);

  const handleAddItem = () => setShowItemsModal(true);

  const handleItemAdded = () => {
    loadInventory(currentPage, LIMIT, selectedProvider);
    showNotification("Item agregado correctamente a la lista.");
  };

  const filteredInventory = useMemo(() => {
    let result = inventoryItems;
    const query = searchQuery.trim().toLowerCase();

    if (query) {
      result = result.filter(
        ({ barcode, description }) =>
          barcode?.toLowerCase().includes(query) ||
          description?.toLowerCase().includes(query),
      );
    }

    if (selectedProvider) {
      result = result.filter((item) => item.provider_id === selectedProvider);
    }

    return result;
  }, [inventoryItems, searchQuery, selectedProvider]);

  console.log("Prov", providers)
  return (
    <div className="page">
      <Sidebar
        activeView="inventory"
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <main className="page-main">
        <MobileHeader
          eyebrow="Panel"
          title="Inventario"
          onMenuClick={() => setIsSidebarOpen(true)}
        />

        <div className="page-header">
          <div>
            <p className="page-header-eyebrow">Panel</p>
            <h1 className="page-title">Inventario</h1>
          </div>
        </div>

        <section className="page-section">
          <div className="inventory-filters grid grid-cols-1 md:grid-cols-[1fr_220px_max-content] gap-4 items-center mb-6">
            <SearchBar query={searchQuery} onChange={setSearchQuery} />
            <select
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value)}
              className="select"
            >
              <option value="">Todas las proveedoras</option>
              {providers?.data?.map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {provider.first_name}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleAddItem}
            >
              Agregar producto
            </button>
          </div>

          {notification && <div className="toast-notification">{notification}</div>}

          <InventoryTable
            ref={inventoryTableRef}
            items={filteredInventory}
            loading={loadingInventory}
            onItemAdded={handleItemAdded}
            providers={providers}
          />
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
            {totalInventory === 0
              ? 0
              : (currentPage - 1) * LIMIT + 1}
            {"-"}
            {Math.min(
              currentPage * LIMIT,
              totalInventory
            )} de {totalInventory} productos
          </p>
        </div>

        <div
          style={{ display: "flex", justifyContent: "center", marginTop: "1rem" }}
        >
          <PaginationComponent
            totalPages={Math.ceil(totalInventory / LIMIT)}
            currentPage={currentPage}
            onChangePage={setCurrentPage}
          />
        </div>
      </main>

      <ItemsFormModal
        isOpen={showItemsModal}
        onClose={() => setShowItemsModal(false)}
        onItemsAdded={handleItemAdded}
        providers={providers}
        providersRefresh={providersRefresh}
      />
    </div>
  );
}

export default InventoryPage;