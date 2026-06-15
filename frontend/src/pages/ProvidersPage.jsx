import { useEffect, useMemo, useRef, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Sidebar from "../components/Sidebar.jsx";
import SearchBar from "../components/SearchBar.jsx";
import InventoryTable from "../components/InventoryTable.jsx";
import ProvidersTable from "../components/ProvidersTable.jsx";
import ProvidersFormModal from "../components/ProvidersFormModal.jsx";

import {
  fetchInventory,
  fetchProviders,
  fetchProvidersComplete,
} from "../services/api.js";

function ProvidersPage() {
  const inventoryTableRef = useRef(null);
  const [notification, setNotification] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [inventory, setInventory] = useState([]);
  const [providers, setProviders] = useState([]);
  const [loadingInventory, setLoadingInventory] = useState(true);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [showProvidersModal, setShowProvidersModal] = useState(false);

  const showNotification = (message) => {
    setNotification(message);

    window.setTimeout(() => {
      setNotification("");
    }, 3200);
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

    // setProvidersRefresh((prev) => prev + 1);
    // setDashboardRefresh((prev) => prev + 1);

    showNotification("Proveedora agregada correctamente.");
  };

  const filteredInventory = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return inventory;
    }

    return inventory.filter(({ codigo, descripcion }) => {
      return (
        codigo?.toLowerCase().includes(query) ||
        descripcion?.toLowerCase().includes(query)
      );
    });
  }, [inventory, searchQuery]);

  const filteredProviders = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return providers;
    }

    return providers.filter((provider) => {
      const nombre =
        `${provider.nombre || ""} ${provider.apellido || ""}`.toLowerCase();

      return (
        nombre.includes(query) ||
        provider.telefono?.toLowerCase().includes(query) ||
        provider.alias?.toLowerCase().includes(query) ||
        provider.cbu?.toLowerCase().includes(query)
      );
    });
  }, [providers, searchQuery]);

  return (
    <div className="min-h-screen md:grid md:grid-cols-[280px_1fr]">
      <Sidebar />

      <main className="p-8">
        <div className="flex items-end justify-between gap-6 mb-7">
          <div>
            <p className="text-accent uppercase tracking-widest text-xs mb-1">
              Panel
            </p>

            <h1 className="text-3xl md:text-4xl m-0">Providers</h1>
          </div>
        </div>

        <section className="bg-slate-800/70 border border-slate-700 rounded-2xl p-7 min-h-[72vh] shadow-soft">
          <div className="grid grid-cols-[1fr_max-content] gap-4 items-center mb-6">
            <SearchBar />

            <button
              className="bg-accent text-slate-900 font-semibold rounded-lg px-4 py-2"
              onClick={() => setShowProvidersModal(true)}
            >
              Agregar proveedora
            </button>
          </div>

          {notification && (
            <div className="toast-notification">{notification}</div>
          )}

          <ProvidersTable
            providers={providers}
            inventoryItems={filteredInventory}
            loading={loadingProviders}
            onDataChange={loadProviders}
          ></ProvidersTable>
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
