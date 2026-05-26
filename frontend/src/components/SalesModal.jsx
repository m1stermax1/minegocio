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
    return inventoryItems
      .filter((item) => {
        if (!item.codigo && !item.descripcion) {
          return false;
        }
        const isSold = (item.estado || "").toLowerCase() === "vendido";
        if (isSold) return false;
        const alreadySelected = selectedItems.some((selected) => selected.id === item.id);
        if (alreadySelected) return false;
        if (!term) return true;
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
        <div className="modal" style={{ maxWidth: "900px", width: "100%", overflow: "scroll" }}>
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

            <div className="form-group">
              <label>Buscar producto</label>
              <input
                className="form-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Código o nombre/descripcion..."
                disabled={loading || isLoadingInventory}
              />
            </div>

            <div style={{ marginBottom: "16px" }}>
              <p style={{ margin: "0 0 8px" }}>Resultados</p>
              {isLoadingInventory ? (
                <p>Cargando productos...</p>
              ) : (
                <div className="search-results-list" style={{ maxHeight: "220px", overflowY: "auto" }}>
                  {availableItems.length === 0 ? (
                    <p style={{ margin: 0, color: "var(--muted)" }}>
                      No hay productos disponibles para agregar.
                    </p>
                  ) : (
                    availableItems.map((item) => (
                      <div key={item.id} className="search-result-item">
                        <div>
                          <strong>{item.codigo || "Sin código"}</strong> — {item.descripcion || "Sin descripción"}
                          <div style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
                            {item.proveedora || "Proveedor no disponible"}
                          </div>
                        </div>
                        <button type="button" className="secondary-btn" onClick={() => handleAddItem(item)}>
                          Agregar
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: "320px" }}>
                <h3 style={{ margin: "0 0 12px" }}>Productos en la venta</h3>
                {selectedItems.length === 0 ? (
                  <div className="table-state">No se agregaron productos aún.</div>
                ) : (
                  <div className="table-wrapper" style={{ maxHeight: "280px", overflowY: "auto" }}>
                    <table className="inventory-table">
                      <thead>
                        <tr>
                          <th>Código</th>
                          <th>Descripción</th>
                          <th>Proveedor</th>
                          <th>Precio</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedItems.map((item) => (
                          <tr key={item.id}>
                            <td>{item.codigo || "-"}</td>
                            <td>{item.descripcion || "-"}</td>
                            <td>{item.proveedora || "-"}</td>
                            <td>{formatPrice(item.precio)}</td>
                            <td>
                              <button type="button" className="secondary-btn" onClick={() => handleRemoveItem(item.id)}>
                                Quitar
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div style={{ flex: 1, minWidth: "240px", display: "flex", flexDirection: "column", gap: "16px" }}>
                <div className="summary-card">
                  <p style={{ margin: 0, fontWeight: 700 }}>Resumen de precios</p>
                  <div className="summary-row">
                    <span>Total bruto</span>
                    <strong>{formatPrice(totalAmount)}</strong>
                  </div>
                  <div className="summary-row">
                    <span>Efectivo (10% off)</span>
                    <strong>{formatPrice(efectivoTotal)}</strong>
                  </div>
                  <div className="summary-row">
                    <span>Transferencia (5% off)</span>
                    <strong>{formatPrice(transferenciaTotal)}</strong>
                  </div>
                </div>

                <div className="summary-card" style={{ textAlign: "center" }}>
                  <p style={{ margin: 0, fontWeight: 700 }}>Método de pago</p>
                  <div style={{ display: "grid", gap: "10px", marginTop: "12px" }}>
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
                        onClick={() => setPaymentMethod(option.value)}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="summary-card">
                  <p style={{ margin: 0, fontWeight: 700 }}>Total a guardar</p>
                  <p style={{ margin: "8px 0 0", fontSize: "1.4rem" }}>
                    {formatPrice(selectedTotal)}
                  </p>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" }}>
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
