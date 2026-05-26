import { useEffect, useState } from 'react';
import { fetchDashboardCounts, fetchProvidersComplete, fetchSales } from '../services/api.js';

function StatCard({ title, value, subtitle }) {
  return (
    <div className="stat-card">
      <p className="stat-title">{title}</p>
      <p className="stat-value">{value}</p>
      {subtitle && <p style={{ fontSize: "0.85rem", color: "var(--muted)", margin: "4px 0 0" }}>{subtitle}</p>}
    </div>
  );
}

export default function DashboardPage({ onAddProduct, onAddSale, onAddProvider, refresh }) {
  const [counts, setCounts] = useState({ inStockCount: 0, soldCount: 0 });
  const [providersCount, setProvidersCount] = useState(0);
  const [totalSold, setTotalSold] = useState(0);
  const [totalOwner, setTotalOwner] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        const [dashboardData, providers, salesData] = await Promise.all([
          fetchDashboardCounts(),
          fetchProvidersComplete(),
          fetchSales(),
        ]);
        if (mounted) {
          setCounts(dashboardData || { inStockCount: 0, soldCount: 0 });
          setProvidersCount(providers?.length || 0);

          // Calcular totales del mes actual
          const now = new Date();
          const currentMonth = now.getMonth();
          const currentYear = now.getFullYear();
          
          let monthlyTotal = 0;
          let monthlyOwner = 0;
          
          (salesData || []).forEach((sale) => {
            const saleDate = sale.fecha ? new Date(sale.fecha) : null;
            if (saleDate && saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear) {
              monthlyTotal += Number(sale.montoTotal) || 0;
              monthlyOwner += (Number(sale.montoTotal) || 0) * 0.1;
            }
          });
          
          setTotalSold(monthlyTotal);
          setTotalOwner(monthlyOwner);
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
  const formatCurrency = (value) => {
    return `$ ${Number(value).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  };

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
            <StatCard 
              title="Total vendido este mes" 
              value={formatCurrency(totalSold)} 
              subtitle="Monto total de ventas"
            />
            <StatCard 
              title="Total para la dueña" 
              value={formatCurrency(totalOwner)} 
              subtitle="10% del total vendido"
            />
          </>
        )}
      </div>
    </section>
  );
}
