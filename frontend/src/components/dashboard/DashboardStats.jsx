import { formatCurrency } from "../../utils/dashboardCalculations.js";

function StatCard({ title, value }) {
  return (
    <div className="stat-card">
      <p className="stat-label">{title}</p>
      <p className="stat-value">{value}</p>
    </div>
  );
}

function PeriodCard({ title, totals }) {
  return (
    <div className="stat-card">
      <p className="stat-label">{title}</p>
      <p className="stat-value">{formatCurrency(totals?.total)}</p>
      <div style={{ marginTop: "0.5rem", fontSize: "0.9rem" }}>
        <div>Local: {formatCurrency(totals?.local)}</div>
        <div>Proveedoras: {formatCurrency(totals?.providers)}</div>
      </div>
    </div>
  );
}

export default function DashboardStats({ stats }) {
  if (!stats) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <StatCard title="Productos en stock" value={stats.inStockCount} />
      <div className="stat-card">
        <p className="stat-label">Productos vendidos</p>
        <p className="stat-value">{stats.soldCount}</p>
        <div style={{ marginTop: "0.5rem", fontSize: "0.9rem" }}>
          <div>Hoy: {Number(stats.counts?.today || 0).toLocaleString("es-AR")}</div>
          <div>Semana: {Number(stats.counts?.weekly || 0).toLocaleString("es-AR")}</div>
          <div>Mes: {Number(stats.counts?.monthly || 0).toLocaleString("es-AR")}</div>
        </div>
      </div>
      <StatCard title="Proveedoras" value={stats.providersCount} />

      <PeriodCard title="Hoy" totals={stats.today} />
      <PeriodCard title="Esta semana" totals={stats.weekly} />
      <PeriodCard title="Este mes" totals={stats.monthly} />
      <div className="stat-card">
        <p className="stat-label">Ticket promedio (mes)</p>
        <p className="stat-value">{formatCurrency(stats.avgTicket?.monthly)}</p>
      </div>
      <div className="stat-card">
        <p className="stat-label">Top producto (mes)</p>
        <p className="stat-value">
          {stats.topProducts?.monthly?.length
            ? `${stats.topProducts.monthly[0].key} — ${stats.topProducts.monthly[0].qty}`
            : "—"}
        </p>
      </div>
    </div>
  );
}