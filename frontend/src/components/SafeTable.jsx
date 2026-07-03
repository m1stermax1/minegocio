import React from "react";

export default function SafeTable({ records = [], loading }) {
  if (loading) return <div className="table-state">Cargando caja...</div>;

  if (!records || records.length === 0) {
    return <div className="table-state">No hay cierres registrados.</div>;
  }

  const formatPrice = (value) => {
    if (value == null || value === "") return "-";
    const amount = Number(value) || 0;
    return `$ ${amount.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`;
  };

  const formatDate = (value) => {
    try {
      const d = new Date(value);
      return d.toLocaleString();
    } catch (_) {
      return value || "-";
    }
  };

  return (
    <div className="table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            <th>Fecha de cierre</th>
            <th>Cantidad total vendida</th>
            <th>Total para local</th>
            <th>Total para proveedoras</th>
          </tr>
        </thead>
        <tbody>
          {records.map((r) => (
            <tr key={r.id}>
              <td data-label="Fecha">{formatDate(r.closed_at || r.created_at || r.fecha)}</td>
              <td data-label="Cantidad">{r.total_items ?? r.total_sold ?? "-"}</td>
              <td data-label="Local">{formatPrice(r.total_local ?? r.total_owner ?? r.total)}</td>
              <td data-label="Proveedoras">{formatPrice(r.total_providers ?? r.total_providers_amount ?? r.total_providers)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
