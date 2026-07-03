import React, { useState } from "react";
import { insertSafeRecord } from "../../services/safeService.js";
import { getProfile } from "../../services/users.js";

export default function CloseDayModal({ isOpen, onClose, stats, onClosed }) {
  const [loading, setLoading] = useState(false);
  const handleCloseDay = async () => {
    try {
      setLoading(true);
      const profile = (await getProfile())?.[0];
      const orgId = profile?.organization_id;
      const payload = {
        organization_id: orgId,
        closed_at: new Date().toISOString(),
        total_items: stats?.soldCount || 0,
        total_sold: stats?.totalSold || 0,
        total_local: stats?.totalProfitToday || 0,
        total_providers: stats?.businessProfit || 0,
      };

      await insertSafeRecord(payload);
      onClosed && onClosed();
      onClose();
    } catch (err) {
      console.error("Error closing day:", err);
      alert("Error al guardar el cierre. Revisa la consola.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal-header">
          <h3>Cerrar día</h3>
        </div>
        <div className="modal-body">
          <p>Fecha: {new Date().toLocaleDateString()}</p>
          <p>Total vendido: $ {Number(stats?.totalSold || 0).toLocaleString("es-AR")}</p>
          <p>Total para local: $ {Number(stats?.totalProfitToday || 0).toLocaleString("es-AR")}</p>
          <p>Total para proveedoras: $ {Number(stats?.businessProfit || 0).toLocaleString("es-AR")}</p>
          <p style={{ marginTop: "1rem", fontWeight: 600 }}>¿Estás segura de que querés cerrar el día?</p>
        </div>
        <div className="modal-footer" style={{ display: "flex", gap: "0.5rem" }}>
          <button className="btn btn-danger" onClick={handleCloseDay} disabled={loading}>
            {loading ? "Guardando..." : "Cerrar día"}
          </button>
          <button className="btn btn-secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
