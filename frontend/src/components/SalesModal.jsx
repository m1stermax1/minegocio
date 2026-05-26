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
    <div className="modal-backdrop">
      <div className="modal" style={{ maxWidth: "900px", width: "100%", maxHeight: "90vh", overflowY: "auto" }}>
        <div className="modal-header">
          <div>
            <h2>Agregar Venta</h2>
            <p style={{ color: "var(--muted)", fontSize: "0.9rem", margin: 0 }}>
              Busca productos por código o descripción y agrégalos a la venta.
            </p>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Cerrar modal">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-form">
            {error && <div className="form-error">{error}</div>}

            <div className="form-group" style={{ marginBottom: "16px" }}>
              <label htmlFor="buscar-producto" style={{ fontWeight: 600, color: "var(--accent)" }}>Buscar producto</label>
              <input
                id="buscar-producto"
                className="form-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(normalizeBarcodeSearch(e.target.value))}
                placeholder="Escribe el código o descripción del producto..."
                disabled={loading || isLoadingInventory}
                autoComplete="off"
              />
            </div>

            {/* Resultados de búsqueda (Solo si hay texto) */}
            {searchTerm.trim() !== "" && (
              <div style={{ marginBottom: "24px" }}>
                <p style={{ margin: "0 0 8px", fontSize: "0.9rem", fontWeight: 600, color: "var(--accent)" }}>
                  Resultados de búsqueda
                </p>
                {isLoadingInventory ? (
                  <p style={{ color: "var(--muted)" }}>Cargando productos...</p>
                ) : (
                  <div className="search-results-list" style={{ maxHeight: "200px", overflowY: "auto" }}>
                    {availableItems.length === 0 ? (
                      <p style={{ margin: "12px", color: "var(--muted)", fontSize: "0.95rem" }}>
                        No se encontraron productos disponibles.
                      </p>
                    ) : (
                      availableItems.map((item) => (
                        <div key={item.id} className="search-result-item" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px" }}>
                          <div>
                            <strong>{item.codigo || "Sin código"}</strong> — {item.descripcion || "Sin descripción"}
                            <div style={{ fontSize: "0.85rem", color: "var(--muted)", marginTop: "2px" }}>
                              Proveedor: {item.proveedora || "mío"} — <strong>{formatPrice(item.precio)}</strong>
                            </div>
                          </div>
                          <button
                            type="button"
                            className="primary-btn"
                            style={{ padding: "6px 12px", fontSize: "0.85rem" }}
                            onClick={() => handleAddItem(item)}
                          >
                            Agregar
                          </button>
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
              <div style={{ flex: "1.3 1 400px", minWidth: "320px", display: "flex", flexDirection: "column", gap: "12px" }}>
                <h3 style={{ margin: "0 0 4px", fontSize: "1.1rem", fontWeight: 700 }}>
                  Prendas agregadas ({selectedItems.length})
                </h3>
                {selectedItems.length === 0 ? (
                  <div className="table-state" style={{ padding: "40px 20px", borderRadius: "14px" }}>
                    No se han seleccionado prendas. Busca y agrega una arriba.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "350px", overflowY: "auto", paddingRight: "4px" }}>
                    {selectedItems.map((item) => (
                      <div
                        key={item.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "12px 16px",
                          backgroundColor: "var(--surface)",
                          border: "1px solid var(--border)",
                          borderRadius: "14px",
                        }}
                      >
                        <div>
                          <span style={{ fontWeight: 700, color: "var(--accent)" }}>{item.codigo || "-"}</span>
                          <span style={{ marginLeft: "8px", fontWeight: 500 }}>{item.descripcion || "-"}</span>
                          <div style={{ fontSize: "0.8rem", color: "var(--muted)", marginTop: "2px" }}>
                            Proveedor: {item.proveedora || "mío"}
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                          <strong style={{ fontSize: "1.05rem" }}>{formatPrice(item.precio)}</strong>
                          <button
                            type="button"
                            className="remove-row-btn"
                            style={{ padding: "6px 10px", fontSize: "0.8rem" }}
                            onClick={() => handleRemoveItem(item.id)}
                          >
                            ✕ Quitar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Columna Derecha: Precios y botones */}
              <div style={{ flex: "0.7 1 300px", minWidth: "280px", display: "flex", flexDirection: "column", gap: "16px" }}>
                <div className="summary-card">
                  <p style={{ margin: "0 0 12px", fontWeight: 700, color: "var(--accent)" }}>Resumen de precios</p>
                  <div className="summary-row" style={{ fontSize: "0.9rem", color: "var(--muted)" }}>
                    <span>Total bruto</span>
                    <span>{formatPrice(totalAmount)}</span>
                  </div>
                  <div className="summary-row" style={{ fontSize: "0.9rem", color: "var(--success)" }}>
                    <span>Efectivo (10% off)</span>
                    <span>{formatPrice(efectivoTotal)}</span>
                  </div>
                  <div className="summary-row" style={{ fontSize: "0.9rem", color: "var(--accent)" }}>
                    <span>Transferencia (5% off)</span>
                    <span>{formatPrice(transferenciaTotal)}</span>
                  </div>
                </div>

                <div className="summary-card">
                  <p style={{ margin: "0 0 12px", fontWeight: 700, color: "var(--accent)" }}>Método de pago</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                    {[
                      { value: "efectivo", label: "Efectivo" },
                      { value: "transferencia", label: "Transferencia" },
                      { value: "debito", label: "Débito" },
                      { value: "credito", label: "Crédito" },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className={paymentMethod === option.value ? "primary-btn" : "secondary-btn"}
                        style={{ padding: "10px 8px", fontSize: "0.85rem" }}
                        onClick={() => setPaymentMethod(option.value)}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="summary-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <p style={{ margin: 0, fontWeight: 700, color: "var(--accent)" }}>Total a guardar</p>
                    <p style={{ margin: "4px 0 0", fontSize: "1.45rem", fontWeight: 800, color: "var(--text)" }}>
                      {formatPrice(selectedTotal)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "28px", borderTop: "1px solid rgba(148, 163, 184, 0.08)", paddingTop: "16px" }}>
              <button type="button" className="secondary-btn" onClick={onClose} disabled={loading}>
                Cancelar
              </button>
              <button type="submit" className="primary-btn" disabled={loading || !selectedItems.length || !paymentMethod}>
                {loading ? "Guardando..." : "Cargar venta"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
