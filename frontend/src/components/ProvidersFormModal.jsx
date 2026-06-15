import { useState } from "react";
import { addProvider } from "../services/api.js";
// import supabase from "../services/supabase.js";
import { getProfile } from "../services/users.js";

function ProvidersFormModal({ isOpen, onClose, onProviderAdded }) {
  const [orgId, setOrgId] = useState("");
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [telefono, setTelefono] = useState("");
  const [bankalias, setbankalias] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    console.log("hago click en guardar");
    // if (!nombre.trim() || !apellido.trim() || !telefono.trim()) {
    //   setError('Nombre, apellido y teléfono son obligatorios');
    //   return;
    // }
    const getOrgId = await getProfile();
    console.log(getOrgId[0].organization_id);
    setOrgId(getOrgId[0].organization_id);
    setLoading(true);
    try {
      // await addProvider(orgId, nombre, apellido, telefono, bankalias);
      setNombre("");
      setApellido("");
      setTelefono("");
      setbankalias("");

      if (onProviderAdded) {
        await onProviderAdded();
      }
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
    <div className="fixed inset-0 shadow-2xs backdrop-blur flex items-center justify-center p-5 z-50">
      <div className="providersModal w-full max-w-md bg-slate-800  border-2 border-[#bf99cc] border border-slate-700 rounded-2xl overflow-hidden">
        <div className="flex items-start justify-between gap-4 p-6 border-b border-slate-700">
          <div>
            <h2 className="text-xl font-semibold">Nueva Proveedora</h2>
            <p className="text-slate-400 text-sm m-0">
              Completa los datos de la proveedora
            </p>
          </div>
          <button
            type="button"
            className="text-slate-400 text-xl p-1 rounded-full hover:text-slate-100"
            onClick={onClose}
            aria-label="Cerrar modal"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 grid gap-4">
            {error && (
              <div className="text-rose-300 bg-rose-900/20 border border-rose-800 rounded-md p-3">
                {error}
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-slate-200">
                Nombre *
              </label>
              <input
                type="text"
                className="w-full mt-2 rounded-lg bg-slate-900/60 border border-slate-700 px-3 py-2 text-slate-100"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: María"
                disabled={loading}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-200">
                Apellido *
              </label>
              <input
                type="text"
                className="w-full mt-2 rounded-lg bg-slate-900/60 border border-slate-700 px-3 py-2 text-slate-100"
                value={apellido}
                onChange={(e) => setApellido(e.target.value)}
                placeholder="Ej: García"
                disabled={loading}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-200">
                Teléfono *
              </label>
              <input
                type="text"
                className="w-full mt-2 rounded-lg bg-slate-900/60 border border-slate-700 px-3 py-2 text-slate-100"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="Ej: +54 9 11 1234-5678"
                disabled={loading}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-200">
                Alias o CBU (opcional)
              </label>
              <input
                type="text"
                className="w-full mt-2 rounded-lg bg-slate-900/60 border border-slate-700 px-3 py-2 text-slate-100"
                value={bankalias}
                onChange={(e) => setbankalias(e.target.value)}
                placeholder="Ej: mi.alias.mp o CBU de 22 dígitos"
                disabled={loading}
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end p-4 border-t border-slate-700">
            <button
              type="button"
              className="bg-slate-900/40 border border-slate-700 text-slate-100 rounded-lg px-3 py-2"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-accent text-slate-900 font-semibold rounded-lg px-4 py-2"
              disabled={loading}
            >
              {loading ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProvidersFormModal;
