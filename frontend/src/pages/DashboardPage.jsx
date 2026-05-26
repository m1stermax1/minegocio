import { useEffect, useState } from 'react';
import { fetchDashboardCounts, fetchProvidersComplete } from '../services/api.js';

function StatCard({ title, value }) {
  return (
    <div className="stat-card">
      <p className="stat-title">{title}</p>
      <p className="stat-value">{value}</p>
    </div>
  );
}

export default function DashboardPage({ onAddProduct, onAddSale, onAddProvider, refresh }) {
  const [counts, setCounts] = useState({ inStockCount: 0, soldCount: 0 });
  const [providersCount, setProvidersCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        const [dashboardData, providers] = await Promise.all([
          fetchDashboardCounts(),
          fetchProvidersComplete(),
        ]);
        if (mounted) {
          setCounts(dashboardData || { inStockCount: 0, soldCount: 0 });
          setProvidersCount(providers?.length || 0);
        }
      } catch (err) {
        console.error('Error cargando dashboard:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => (mounted = false);
  }, [refresh]);
  return (
    <section className="dashboard-panel">
      <div className="dashboard-cards">
        {loading ? (
          <p>Cargando...</p>
        ) : (
          <>
            <StatCard title="Productos en stock" value={counts.inStockCount} />
            <StatCard title="Productos vendidos" value={counts.soldCount} />
            <StatCard title="Proveedoras" value={providersCount} />
          </>
        )}
      </div>
    </section>
  );
}
