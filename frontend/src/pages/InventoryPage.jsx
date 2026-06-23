import { useEffect, useMemo, useRef, useState } from "react";

import Sidebar from "../components/Sidebar.jsx";
import SearchBar from "../components/SearchBar.jsx";
import InventoryTable from "../components/InventoryTable.jsx";
import ItemsFormModal from "../components/ItemsFormModal.jsx";

import {
  fetchInventory,
  fetchProviders,
} from "../services/api.js";

function InventoryPage() {
  const inventoryTableRef = useRef(null);
  const [inventory, setInventory] = useState([]);
  const [providers, setProviders] = useState([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [notification, setNotification] = useState("");

  const [providersRefresh, setProvidersRefresh] = useState(0);

  const [loadingInventory, setLoadingInventory] = useState(true);
  const [loadingProviders, setLoadingProviders] = useState(false);

  const [showItemsModal, setShowItemsModal] = useState(false);

  const showNotification = (message) => {
    setNotification(message);

    window.setTimeout(() => {
      setNotification("");
    }, 3200);
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

  const loadProviders = async () => {
    try {
      setLoadingProviders(true);
      const data = await fetchProviders();
      console.log("Cargo las proveedoras" ,data);
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
    loadInventory();
  }, []);

  const handleAddItem = () => {
    setShowItemsModal(true);
  };

  const handleItemAdded = () => {
    loadInventory();
    setDashboardRefresh((prev) => prev + 1);
    showNotification("Item agregado correctamente a la lista.");
  };

  const filteredInventory = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return inventory;
    }

    return inventory?.filter(({ barcode, description }) => {
      return (
        barcode?.toLowerCase().includes(query) ||
        description?.toLowerCase().includes(query)
      );
    });
  }, [inventory, searchQuery]);

  // const filteredProviders = useMemo(() => {
  //   const query = searchQuery.trim().toLowerCase();

  //   if (!query) {
  //     return providers;
  //   }

  //   return providers.filter((provider) => {
  //     const nombre =
  //       `${provider.nombre || ""} ${provider.apellido || ""}`.toLowerCase();

  //     return (
  //       nombre.includes(query) ||
  //       provider.telefono?.toLowerCase().includes(query) ||
  //       provider.alias?.toLowerCase().includes(query) ||
  //       provider.cbu?.toLowerCase().includes(query)
  //     );
  //   });
  // }, [providers, searchQuery]);

  // const filteredSales = useMemo(() => {
  //   return filteredInventory.filter(
  //     (item) => item.estado?.toLowerCase() === "vendido",
  //   );
  // }, [filteredInventory]);

  // const filteredPayments = useMemo(() => {
  //   return filteredProviders.filter(
  //     (item) => item.pago?.toLowerCase() === "pagado",
  //   );
  // }, [filteredProviders]);

  return ( 
    <div className="min-h-screen md:grid md:grid-cols-[280px_1fr]">
      <Sidebar />

      <main className="p-8">
        <div className="flex items-end justify-between gap-6 mb-7">
          <div>
            <p className="text-accent uppercase tracking-widest text-xs mb-1">
              Panel
            </p>

            <h1 className="text-3xl md:text-4xl m-0">Inventario</h1>
          </div>
        </div>

        <section className="bg-slate-800/70 border border-slate-700 rounded-2xl p-7 min-h-[72vh] shadow-soft">
          <div className="grid grid-cols-[1fr_max-content] gap-4 items-center mb-6">
            <SearchBar query={searchQuery} onChange={setSearchQuery} />
            <button
              className="bg-accent text-slate-900 font-semibold rounded-lg px-4 py-2"
              onClick={handleAddItem}
            >
              Agregar producto
            </button>
          </div>

          {notification && (
            <div className="toast-notification">{notification}</div>
          )}
          <InventoryTable
            ref={inventoryTableRef}
            items={filteredInventory}
            loading={loadingInventory}
            onItemAdded={handleItemAdded}
            providers={providers}
          />
        </section>
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
