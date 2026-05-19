import { useEffect, useMemo, useState } from 'react';
import Sidebar from '../components/Sidebar.jsx';
import SearchBar from '../components/SearchBar.jsx';
import InventoryTable from '../components/InventoryTable.jsx';
import ProvidersTable from '../components/ProvidersTable.jsx';
import { fetchInventory, fetchProviders } from '../services/api.js';

function InventoryPage() {
  const [activeView, setActiveView] = useState('inventory');
  const [inventory, setInventory] = useState([]);
  const [providers, setProviders] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingInventory, setLoadingInventory] = useState(true);
  const [loadingProviders, setLoadingProviders] = useState(false);

  async function loadInventory() {
    try {
      setLoadingInventory(true);
      const data = await fetchInventory();
      setInventory(data);
    } catch (error) {
      console.error('Error cargando inventario:', error);
      setInventory([]);
    } finally {
      setLoadingInventory(false);
    }
  }

  useEffect(() => {
    loadInventory();
  }, []);

  useEffect(() => {
    async function loadProviders() {
      try {
        setLoadingProviders(true);
        const data = await fetchProviders();
        setProviders(data);
      } catch (error) {
        console.error('Error cargando proveedoras:', error);
        setProviders([]);
      } finally {
        setLoadingProviders(false);
      }
    }

    if (activeView === 'providers') {
      loadProviders();
    }

    if (activeView === 'inventory') {
      loadInventory();
    }
  }, [activeView]);

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
      const codigo = item.codigo?.toLowerCase() || '';
      const nombre = item.nombre?.toLowerCase() || '';
      const descripcion = item.descripcion?.toLowerCase() || '';
      const precio = item.precio?.toString().toLowerCase() || '';
      const estado = item.estado?.toLowerCase() || '';
      return (
        codigo.includes(query) ||
        nombre.includes(query) ||
        descripcion.includes(query) ||
        precio.includes(query) ||
        estado.includes(query)
      );
    });
  }, [providers, searchQuery]);

  const pageTitle = activeView === 'inventory' ? 'Inventario' : 'Proveedoras';
  const isInventory = activeView === 'inventory';

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
          <SearchBar query={searchQuery} onChange={setSearchQuery} />
          {isInventory ? (
            <InventoryTable items={filteredInventory} loading={loadingInventory} />
          ) : (
            <ProvidersTable items={filteredProviders} loading={loadingProviders} />
          )}
        </section>
      </main>
    </div>
  );
}

export default InventoryPage;
