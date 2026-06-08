import { useEffect, useState } from "react";
import {
  fetchDashboardCounts,
  fetchProvidersComplete,
  fetchSales,
  fetchOwnerTotal,
} from "../services/api.js";

function StatCard({ title, value, subtitle }) {
  return (
    <div className="dashboard-card bg-slate-800 border border-slate-700 rounded-2xl p-5 shadow">
      <p className="text-sm text-slate-400 tracking-wide">{title}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      {subtitle && <p className="text-sm text-slate-400 mt-1">{subtitle}</p>}
    </div>
  );
}

export default function DashboardPage({
  onAddProduct,
  onAddSale,
  onAddProvider,
  refresh,
}) {
  const [counts, setCounts] = useState({ inStockCount: 0, soldCount: 0 });
  const [providersCount, setProvidersCount] = useState(0);
  const [totalSold, setTotalSold] = useState(0);
  const [totalOwner, setTotalOwner] = useState(0);
  const [loading, setLoading] = useState(true);

  const parseSaleDate = (dateString) => {
    if (!dateString) return null;

    // formato YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const [year, month, day] = dateString.split("-").map(Number);

      return new Date(year, month - 1, day);
    }

    // fallback para fechas viejas ISO
    const parsed = new Date(dateString);

    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        const API_URL = import.meta.env.VITE_API_URL;

        console.log(API_URL);

        const obtenerSaludo = async () => {
          const res = await fetch(`${API_URL}/inventory`);
          const data = await res.json();
          console.log(data);
        };

        obtenerSaludo();
        const [dashboardData, providers, salesData, ownerTotal] =
          await Promise.all([
            fetchDashboardCounts(),
            fetchProvidersComplete(),
            fetchSales(),
            fetchOwnerTotal(),
          ]);
        if (mounted) {
          setCounts(dashboardData || { inStockCount: 0, soldCount: 0 });
          setProvidersCount(providers?.length || 0);

          // Calcular totales del mes actual
          const now = new Date();
          const currentMonth = now.getMonth();
          const currentYear = now.getFullYear();

          // total vendido (suma de salesData por el mes)
          let monthlyTotal = 0;
          (salesData || []).forEach((sale) => {
            const saleDate = parseSaleDate(sale.fecha);
            if (
              saleDate &&
              saleDate.getMonth() === currentMonth &&
              saleDate.getFullYear() === currentYear
            ) {
              monthlyTotal += Number(sale.montoTotal) || 0;
            }
          });

          setTotalSold(monthlyTotal);
          // ownerTotal viene calculado en backend: suma por item de (precio venta (col D) - precio sugerido(col C)*0.6)
          setTotalOwner(ownerTotal || 0);
        }
      } catch (err) {
        console.error("Error cargando dashboard:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => (mounted = false);
  }, [refresh]);
  const formatCurrency = (value) => {
    return `$ ${Number(value).toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  };

  return (
    <section className="p-3 min-h-[72vh]">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
            />
          </>
        )}
      </div>
    </section>
  );
}
