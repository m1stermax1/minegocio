import { useState } from "react";
import { addProvider } from "../services/api.js";
import { getProfile } from "../services/users.js";

function ProvidersFormModal({ isOpen, onClose, onProviderAdded }) {
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [telefono, setTelefono] = useState("");
  const [bankalias, setbankalias] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!nombre.trim() || !apellido.trim() || !telefono.trim()) {
      setError("Nombre, apellido y teléfono son obligatorios");
      return;
    }

    setLoading(true);
    try {
      const getOrgId = await getProfile();
      const getOrganizationId = getOrgId[0].organization_id;

      await addProvider(getOrganizationId, nombre, apellido, telefono, bankalias);

      setNombre("");
      setApellido("");
      setTelefono("");
      setbankalias("");

      if (onProviderAdded) await onProviderAdded();
      onClose();
    } catch (err) {
      console.error("Error agregando proveedora:", err);
      setError(err.response?.data?.error || "Error al agregar la proveedora");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-container modal-md">
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Nueva Proveedora</h2>
            <p className="modal-subtitle">
              Completá los datos para registrar una nueva proveedora
            </p>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-icon"
            onClick={onClose}
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: "grid", gap: "1rem" }}>
            {error && <div className="alert alert-error">{error}</div>}

            {/* Nombre + Apellido en grid 2-cols */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "0.75rem",
              }}
            >
              <div>
                <label className="label" htmlFor="nombre">
                  Nombre <span style={{ color: "var(--danger)" }}>*</span>
                </label>
                <input
                  id="nombre"
                  type="text"
                  className="input"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: María"
                  disabled={loading}
                  autoComplete="given-name"
                />
              </div>
              <div>
                <label className="label" htmlFor="apellido">
                  Apellido <span style={{ color: "var(--danger)" }}>*</span>
                </label>
                <input
                  id="apellido"
                  type="text"
                  className="input"
                  value={apellido}
                  onChange={(e) => setApellido(e.target.value)}
                  placeholder="Ej: García"
                  disabled={loading}
                  autoComplete="family-name"
                />
              </div>
            </div>

            {/* Teléfono + Alias en grid 2-cols */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "0.75rem",
              }}
            >
              <div>
                <label className="label" htmlFor="telefono">
                  Teléfono <span style={{ color: "var(--danger)" }}>*</span>
                </label>
                <input
                  id="telefono"
                  type="text"
                  className="input"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="+54 9 11 1234-5678"
                  disabled={loading}
                  autoComplete="tel"
                />
              </div>
              <div>
                <label className="label-muted" htmlFor="alias">
                  Alias o CBU (opcional)
                </label>
                <input
                  id="alias"
                  type="text"
                  className="input"
                  value={bankalias}
                  onChange={(e) => setbankalias(e.target.value)}
                  placeholder="mi.alias.mp o CBU de 22 dígitos"
                  disabled={loading}
                />
              </div>
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
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Guardando..." : "✓ Guardar proveedora"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProvidersFormModal;