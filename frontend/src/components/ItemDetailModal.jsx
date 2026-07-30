import { useState, useEffect } from "react";
import { updateInventoryItem } from "../services/api.js";

function ItemDetailModal({ isOpen, item, providers = [], onClose, onItemUpdated }) {
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [providerId, setProviderId] = useState("");
  const [status, setStatus] = useState("AVAILABLE");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const providersList = Array.isArray(providers)
    ? providers
    : providers?.data || [];

  useEffect(() => {
    if (item) {
      setDescription(item.description || "");
      setPrice(item.price !== undefined ? item.price : "");
      setProviderId(item.provider_id || "");
      setStatus(item.status || "AVAILABLE");
      setError("");
    }
  }, [item, isOpen]);

  if (!isOpen || !item) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!description.trim()) {
      setError("La descripción del producto es obligatoria.");
      return;
    }

    const numericPrice = Number(String(price).replace(/,/g, "."));
    if (!Number.isFinite(numericPrice) || numericPrice < 0) {
      setError("El precio ingresado es inválido.");
      return;
    }

    const selectedProviderObj = providersList.find(
      (p) => `${p.id}` === `${providerId}`
    );
    const providerName = selectedProviderObj
      ? `${selectedProviderObj.first_name || ""} ${selectedProviderObj.last_name || ""}`.trim()
      : item.providerName;

    setLoading(true);
    try {
      const res = await updateInventoryItem(item.id, {
        description: description.trim(),
        price: numericPrice,
        provider_id: providerId || null,
        providerName,
        status,
      });

      if (res && res.success === false) {
        throw new Error(res.error || "No se pudo actualizar el producto");
      }

      onItemUpdated?.();
      onClose();
    } catch (err) {
      console.error("Error al actualizar el producto:", err);
      setError(err?.response?.data?.error || err?.message || "Error al actualizar el producto.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-container modal-md">
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Detalle del Producto</h2>
            <p className="modal-subtitle">
              Consulta y edita los campos del producto
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

            {/* Código de barras e ID (sólo lectura) */}
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
                <span className="label-muted">Código de Barra:</span>
                <p style={{ fontWeight: 600, margin: "0.25rem 0 0" }}>
                  {item.barcode || "Sin código"}
                </p>
              </div>
              <div>
                <span className="label-muted">ID del Sistema:</span>
                <p style={{ fontWeight: 500, margin: "0.25rem 0 0", fontSize: "0.875rem" }}>
                  {item.id}
                </p>
              </div>
            </div>

            {/* Nombre del Producto */}
            <div>
              <label className="label" htmlFor="edit-item-desc">
                Descripción / Nombre <span style={{ color: "var(--danger)" }}>*</span>
              </label>
              <input
                id="edit-item-desc"
                type="text"
                className="input"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ej: Remera Talle L"
                disabled={loading}
              />
            </div>

            {/* Precio y Estado */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                gap: "0.75rem",
              }}
            >
              <div>
                <label className="label" htmlFor="edit-item-price">
                  Precio ($) <span style={{ color: "var(--danger)" }}>*</span>
                </label>
                <input
                  id="edit-item-price"
                  type="number"
                  step="0.01"
                  className="input"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="label" htmlFor="edit-item-status">
                  Estado <span style={{ color: "var(--danger)" }}>*</span>
                </label>
                <select
                  id="edit-item-status"
                  className="select"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  disabled={loading}
                >
                  <option value="AVAILABLE">En Stock (Disponible)</option>
                  <option value="SOLD">Vendido</option>
                </select>
              </div>
            </div>

            {/* Proveedora */}
            <div>
              <label className="label" htmlFor="edit-item-provider">
                Proveedora Asignada
              </label>
              <select
                id="edit-item-provider"
                className="select"
                value={providerId}
                onChange={(e) => setProviderId(e.target.value)}
                disabled={loading}
              >
                <option value="">Sin proveedora asignada</option>
                {providersList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.first_name} {p.last_name}
                  </option>
                ))}
              </select>
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

export default ItemDetailModal;
