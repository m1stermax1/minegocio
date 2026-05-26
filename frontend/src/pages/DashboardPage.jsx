import { useEffect, useState } from 'react';
import { fetchDashboardCounts } from '../services/api.js';

function StatCard({ title, value }) {
  return (
    <div className="stat-card">
      <p className="stat-title">{title}</p>
      <p className="stat-value">{value}</p>
    </div>
  );
}

export default function DashboardPage({ onAddProduct, onAddSale, onAddProvider }) {
  const [counts, setCounts] = useState({ inStockCount: 0, soldCount: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        const data = await fetchDashboardCounts();
        if (mounted) setCounts(data || { inStockCount: 0, soldCount: 0 });
      } catch (err) {
        console.error('Error cargando dashboard:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => (mounted = false);
  }, []);

  return (
    <section className="dashboard-panel">
      <div className="controls-row">
        <button className="secondary-btn" type="button" onClick={onAddProduct}>
          Agregar producto
        </button>
        <button className="secondary-btn" type="button" onClick={onAddSale}>
          Agregar venta
        </button>
        <button className="secondary-btn" type="button" onClick={onAddProvider}>
          Agregar proveedora
        </button>
      </div>

      <div className="dashboard-cards">
        {loading ? (
          <p>Cargando...</p>
        ) : (
          <>
            <StatCard title="Productos en stock" value={counts.inStockCount} />
            <StatCard title="Productos vendidos" value={counts.soldCount} />
          </>
        )}
      </div>
    </section>
  );
}
