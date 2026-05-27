import { useMemo, useState } from "react";
import { createSale } from "../services/api.js";

const formatPrice = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return "-";
  }
  return `$ ${number.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

export default function SalesModal({ isOpen, onClose, inventoryItems = [], onSaleCreated, isLoadingInventory }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItems, setSelectedItems] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const availableItems = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return [];
    return inventoryItems
      .filter((item) => {
        if (!item.codigo && !item.descripcion) {
          return false;
        }
        const isSold = (item.estado || "").toLowerCase() === "vendido";
        if (isSold) return false;
        const alreadySelected = selectedItems.some((selected) => selected.id === item.id);
        if (alreadySelected) return false;
        const codigo = item.codigo?.toLowerCase() || "";
        const descripcion = item.descripcion?.toLowerCase() || "";
        return codigo.includes(term) || descripcion.includes(term);
      })
      .slice(0, 10);
  }, [inventoryItems, searchTerm, selectedItems]);

  const totalAmount = selectedItems.reduce((sum, item) => {
    const value = Number(item.precio) || 0;
    return sum + value;
  }, 0);

  const efectivoTotal = totalAmount * 0.9;
  const transferenciaTotal = totalAmount * 0.95;
  const selectedTotal =
    paymentMethod === "efectivo"
      ? efectivoTotal
      : paymentMethod === "transferencia"
      ? transferenciaTotal
      : totalAmount;

  const handleAddItem = (item) => {
    setError("");
    setSelectedItems((prev) => [...prev, item]);
  };

  const handleRemoveItem = (id) => {
    setSelectedItems((prev) => prev.filter((item) => item.id !== id));
  };

  const normalizeBarcodeSearch = (value) => {
    return value.replace(/[’'‘]/g, '-');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!selectedItems.length) {
      setError("Agrega al menos un producto a la venta.");
      return;
    }

    if (!paymentMethod) {
      setError("Selecciona un método de pago.");
      return;
    }

    setLoading(true);
    try {
      await createSale({
        items: selectedItems.map((item) => ({
          id: item.id,
          codigo: item.codigo,
          descripcion: item.descripcion,
          precio: item.precio,
          proveedora: item.proveedora,
        })),
        metodoPago: paymentMethod,
      });

      setSelectedItems([]);
      setPaymentMethod("");
      setSearchTerm("");

      if (onSaleCreated) {
        onSaleCreated();
      }

      onClose();
    } catch (err) {
      console.error("Error cargando venta:", err);
      setError(err.response?.data?.error || "No se pudo guardar la venta.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur flex items-center justify-center p-5 z-50">
      <div className="w-full max-w-4xl bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden max-h-[90vh]">
        <div className="flex items-start justify-between gap-4 p-6 border-b border-slate-700">
          <div>
            <h2 className="text-xl font-semibold">Agregar Venta</h2>
            <p className="text-slate-400 text-sm m-0">Busca productos por código o descripción y agrégalos a la venta.</p>
          </div>
          <button type="button" className="text-slate-400 text-xl p-1 rounded-full hover:text-slate-100" onClick={onClose} aria-label="Cerrar modal">✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 overflow-y-auto">
            {error && <div className="text-rose-300 bg-rose-900/20 border border-rose-800 rounded-md p-3">{error}</div>}

            <div className="mb-4">
              <label htmlFor="buscar-producto" className="block font-semibold text-accent mb-2">Buscar producto</label>
              <input id="buscar-producto" className="w-full px-3 py-2 rounded-lg bg-slate-900/60 border border-slate-700 text-slate-100" value={searchTerm} onChange={(e) => setSearchTerm(normalizeBarcodeSearch(e.target.value))} placeholder="Escribe el código o descripción del producto..." disabled={loading || isLoadingInventory} autoComplete="off" />
            </div>

            {/* Resultados de búsqueda (Solo si hay texto) */}
            {searchTerm.trim() !== "" && (
              <div style={{ marginBottom: "24px" }}>
                <p style={{ margin: "0 0 8px", fontSize: "0.9rem", fontWeight: 600, color: "var(--accent)" }}>
                  Resultados de búsqueda
                </p>
                {isLoadingInventory ? (
                  <p className="text-slate-400">Cargando productos...</p>
                ) : (
                  <div className="max-h-[200px] overflow-y-auto">
                    {availableItems.length === 0 ? (
                      <p className="m-3 text-slate-400 text-sm">No se encontraron productos disponibles.</p>
                    ) : (
                      availableItems.map((item) => (
                        <div key={item.id} className="flex justify-between items-center p-3 rounded-md hover:bg-slate-900/30">
                          <div>
                            <strong>{item.codigo || "Sin código"}</strong> — {item.descripcion || "Sin descripción"}
                            <div className="text-sm text-slate-400 mt-1">Proveedor: {item.proveedora || "mío"} — <strong>{formatPrice(item.precio)}</strong></div>
                          </div>
                          <button type="button" className="bg-accent text-slate-900 rounded-lg px-3 py-1 text-sm" onClick={() => handleAddItem(item)}>Agregar</button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Acomodo de UI en 2 Columnas */}
            <div style={{ display: "flex", gap: "24px", flexWrap: "wrap", marginTop: "8px" }}>
              {/* Columna Izquierda: Prendas agregadas */}
              <div className="flex-1 min-w-[320px] flex flex-col gap-3">
                <h3 style={{ margin: "0 0 4px", fontSize: "1.1rem", fontWeight: 700 }}>
                  Prendas agregadas ({selectedItems.length})
                </h3>
                {selectedItems.length === 0 ? (
                  <div className="p-8 rounded-lg text-slate-400">No se han seleccionado prendas. Busca y agrega una arriba.</div>
                ) : (
                  <div className="flex flex-col gap-3 max-h-[350px] overflow-y-auto pr-2">
                    {selectedItems.map((item) => (
                      <div key={item.id} className="flex justify-between items-center p-3 bg-slate-900/30 border border-slate-700 rounded-md">
                        <div>
                          <span className="font-bold text-accent">{item.codigo || '-'}</span>
                          <span className="ml-2 font-medium">{item.descripcion || '-'}</span>
                          <div className="text-sm text-slate-400 mt-1">Proveedor: {item.proveedora || 'mío'}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <strong className="text-lg">{formatPrice(item.precio)}</strong>
                          <button type="button" className="bg-rose-900/30 text-rose-300 border border-rose-700 rounded-md px-3 py-1 text-sm" onClick={() => handleRemoveItem(item.id)}>✕ Quitar</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Columna Derecha: Precios y botones */}
              <div className="w-full max-w-[360px] min-w-[280px] flex flex-col gap-4">
                <div className="p-4 bg-slate-900/20 border border-slate-700 rounded-md">
                  <p className="font-bold text-accent mb-2">Resumen de precios</p>
                  <div className="text-sm text-slate-400 flex justify-between"><span>Total bruto</span><span>{formatPrice(totalAmount)}</span></div>
                  <div className="text-sm text-emerald-400 flex justify-between"><span>Efectivo (10% off)</span><span>{formatPrice(efectivoTotal)}</span></div>
                  <div className="text-sm text-accent flex justify-between"><span>Transferencia (5% off)</span><span>{formatPrice(transferenciaTotal)}</span></div>
                </div>

                <div className="p-4 bg-slate-900/20 border border-slate-700 rounded-md">
                  <p className="font-bold text-accent mb-2">Método de pago</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[{ value: 'efectivo', label: 'Efectivo' }, { value: 'transferencia', label: 'Transferencia' }, { value: 'debito', label: 'Débito' }, { value: 'credito', label: 'Crédito' }].map((option) => (
                      <button key={option.value} type="button" className={paymentMethod === option.value ? 'bg-accent text-slate-900 rounded-lg px-3 py-2' : 'bg-slate-900/40 border border-slate-700 text-slate-100 rounded-lg px-3 py-2'} onClick={() => setPaymentMethod(option.value)}>{option.label}</button>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-slate-900/10 border border-slate-700 rounded-md flex items-center justify-between">
                  <div>
                    <p className="m-0 font-bold text-accent">Total a guardar</p>
                    <p className="m-0 text-2xl font-extrabold">{formatPrice(selectedTotal)}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-700">
              <button type="button" className="bg-slate-900/40 border border-slate-700 text-slate-100 rounded-lg px-3 py-2" onClick={onClose} disabled={loading}>Cancelar</button>
              <button type="submit" className="bg-accent text-slate-900 font-semibold rounded-lg px-4 py-2" disabled={loading || !selectedItems.length || !paymentMethod}>{loading ? 'Guardando...' : 'Cargar venta'}</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
