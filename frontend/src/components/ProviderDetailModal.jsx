import { useState, useEffect } from "react";
import { updateProvider } from "../services/api.js";

function ProviderDetailModal({ isOpen, provider, onClose, onProviderUpdated }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [bankalias, setBankalias] = useState("");
  const [percentage, setPercentage] = useState("60");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (provider) {
      setFirstName(provider.first_name || "");
      setLastName(provider.last_name || "");
      setPhone(provider.phone || "");
      setBankalias(provider.bankalias || "");
      setPercentage(provider.percentage !== undefined ? String(provider.percentage) : "60");
      setError("");
    }
  }, [provider, isOpen]);

  if (!isOpen || !provider) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!firstName.trim() || !lastName.trim() || !phone.trim()) {
      setError("Nombre, apellido y teléfono son obligatorios.");
      return;
    }

    const percentageVal = Number(percentage);
    if (!Number.isFinite(percentageVal) || percentageVal <= 0 || percentageVal > 100) {
      setError("El porcentaje debe ser mayor a 0 y menor o igual a 100.");
      return;
    }

    setLoading(true);
    try {
      const res = await updateProvider(provider.id, {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone.trim(),
        bankalias: bankalias.trim(),
        percentage: percentageVal,
      });

      if (res && res.success === false) {
        throw new Error(res.error || "No se pudo actualizar la proveedora.");
      }

      onProviderUpdated?.();
      onClose();
    } catch (err) {
      console.error("Error al actualizar proveedora:", err);
      setError(err?.response?.data?.error || err?.message || "Error al actualizar la proveedora.");
    } finally {
      setLoading(false);
    }
  };

  const productCount = Number(provider?.inventory?.[0]?.count ?? 0);

  return (
    <div className="modal-backdrop">
      <div className="modal-container modal-md">
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Detalle de Proveedora</h2>
            <p className="modal-subtitle">
              Consulta y edita los datos de la proveedora
            </p>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-icon"
            onClick={onClose}
            aria-label="Cerrar"
            disabled={loading}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: "grid", gap: "1rem" }}>
            {error && <div className="alert alert-error">{error}</div>}

            {/* Info de resumen (ID y cantidad de productos) */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "0.75rem",
                padding: "0.75rem",
                background: "var(--bg-surface-2)",
                borderRadius: "0.5rem",
                border: "1px solid var(--border)",
              }}
            >
              <div>
                <span className="label-muted">ID Proveedora:</span>
                <p style={{ fontWeight: 500, margin: "0.25rem 0 0", fontSize: "0.875rem" }}>
                  {provider.id}
                </p>
              </div>
              <div>
                <span className="label-muted">Productos Registrados:</span>
                <p style={{ fontWeight: 600, margin: "0.25rem 0 0" }}>
                  {productCount} producto{productCount === 1 ? "" : "s"}
                </p>
              </div>
            </div>

            {/* Nombre y Apellido */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "0.75rem",
              }}
            >
              <div>
                <label className="label" htmlFor="edit-provider-fname">
                  Nombre <span style={{ color: "var(--danger)" }}>*</span>
                </label>
                <input
                  id="edit-provider-fname"
                  type="text"
                  className="input"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Ej: María"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="label" htmlFor="edit-provider-lname">
                  Apellido <span style={{ color: "var(--danger)" }}>*</span>
                </label>
                <input
                  id="edit-provider-lname"
                  type="text"
                  className="input"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Ej: Pérez"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Teléfono y Alias */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "0.75rem",
              }}
            >
              <div>
                <label className="label" htmlFor="edit-provider-phone">
                  Teléfono <span style={{ color: "var(--danger)" }}>*</span>
                </label>
                <input
                  id="edit-provider-phone"
                  type="text"
                  className="input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+54 9 11 ..."
                  disabled={loading}
                />
              </div>
              <div>
                <label className="label-muted" htmlFor="edit-provider-alias">
                  Alias o CBU
                </label>
                <input
                  id="edit-provider-alias"
                  type="text"
                  className="input"
                  value={bankalias}
                  onChange={(e) => setBankalias(e.target.value)}
                  placeholder="mi.alias.mp"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Porcentaje */}
            <div>
              <label className="label" htmlFor="edit-provider-percentage">
                Porcentaje para la proveedora (%) <span style={{ color: "var(--danger)" }}>*</span>
              </label>
              <input
                id="edit-provider-percentage"
                type="number"
                step="0.01"
                min="0.01"
                max="100"
                className="input"
                value={percentage}
                onChange={(e) => setPercentage(e.target.value)}
                placeholder="60"
                disabled={loading}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? "Guardando..." : "✓ Guardar Cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProviderDetailModal;
