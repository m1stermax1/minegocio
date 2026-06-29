import { formatCurrency } from "../../utils/dashboardCalculations.js";

function StatCard({ title, value }) {
  return (
    <div className="stat-card">
      <p className="stat-label">{title}</p>
      <p className="stat-value">{value}</p>
    </div>
  );
}

export default function DashboardStats({ stats }) {
  if (!stats) return null;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <StatCard title="Productos en stock" value={stats.inStockCount} />
      <StatCard title="Productos vendidos" value={stats.soldCount} />
      <StatCard title="Proveedoras" value={stats.providersCount} />
      <StatCard title="Total vendido este mes" value={formatCurrency(stats.totalSold)} />
      <StatCard title="Total Hoy" value={formatCurrency(stats.totalProfitToday)} />
      <StatCard title="Total Para Mi" value={formatCurrency(stats.businessProfit)} />
    </div>
  );
}