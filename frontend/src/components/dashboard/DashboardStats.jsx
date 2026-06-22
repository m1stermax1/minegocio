import { formatCurrency } from "../../utils/dashboardCalculations.js";

function StatCard({ title, value }) {
  return (
    <div className="dashboard-card bg-slate-800 border border-slate-700 rounded-2xl p-5 shadow">
      <p className="text-sm text-slate-400 tracking-wide">
        {title}
      </p>

      <p className="text-2xl font-bold mt-1">
        {value}
      </p>
    </div>
  );
}

export default function DashboardStats({
  stats,
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <StatCard
        title="Productos en stock"
        value={stats.inStockCount}
      />

      <StatCard
        title="Productos vendidos"
        value={stats.soldCount}
      />

      <StatCard
        title="Proveedoras"
        value={stats.providersCount}
      />

      <StatCard
        title="Total vendido este mes"
        value={formatCurrency(stats.totalSold)}
      />

      <StatCard
        title="Total Hoy"
        value={formatCurrency(stats.totalProfitToday)}
      />

      <StatCard
        title="Total Para Mi"
        value={formatCurrency(stats.businessProfit)}
      />
    </div>
  );
}