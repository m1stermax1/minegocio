import { useEffect, useMemo, useState } from "react";
import { getProfile } from "../services/users.js";
import {
  createSale,
  createSalesItem,
  createPayments,
  createInvoices,
  updateInventoryRowStatus,
} from "../services/api.js";

const formatPrice = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return "-";
  return `$ ${number.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

export default function SalesModal({
  isOpen,
  onClose,
  inventoryItems = [],
  onSaleCreated,
  isLoadingInventory,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItems, setSelectedItems] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const availableItems = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const safeItems = Array.isArray(inventoryItems) ? inventoryItems : [];
    if (!term) return [];
    return safeItems
      .filter((item) => item?.status === "AVAILABLE")
      .filter((item) => {
        if (!item?.description) return false;
        const alreadySelected = selectedItems.some((s) => s.id === item.id);
        if (alreadySelected) return false;
        const codigo = item.barcode?.toLowerCase() || "";
        const descripcion = item.description?.toLowerCase() || "";
        return codigo.includes(term) || descripcion.includes(term);
      })
      .slice(0, 8);
  }, [inventoryItems, searchTerm, selectedItems]);

  const totalAmount = selectedItems.reduce((sum, item) => {
    const value = Number(item?.profile == null ? item.price : item.price * 0.6) || 0;
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
    setSelectedItems((prev) => {
      if (prev.some((s) => s.id === item.id)) return prev;
      return [...prev, item];
    });
    setSearchTerm("");
  };

  const handleRemoveItem = (id) => {
    setSelectedItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handlePriceCardClick = (method) => {
    setPaymentMethod((prev) => (prev === method ? "" : method));
  };

  useEffect(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term || availableItems.length !== 1) return;
    const item = availableItems[0];
    if (
      item.barcode?.toLowerCase() === term &&
      !selectedItems.some((s) => s.id === item.id)
    ) {
      handleAddItem(item);
    }
  }, [searchTerm, availableItems, selectedItems]);

  const normalizeBarcodeSearch = (value) => value.replace(/[''']/g, "-");

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
      const perfil = await getProfile();
      const salesCreated = await createSale({
        orgId: perfil[0]?.organization_id,
        totalSale: selectedTotal,
        metodoPago: paymentMethod,
      });

      const updatedItems = selectedItems.map((item) => ({ ...item, paymentMethod }));
      await createSalesItem({
        orgId: perfil[0]?.organization_id,
        saleId: salesCreated?.data[0]?.id,
        items: updatedItems,
        totalSaleAmount: selectedTotal,
        paymethod: paymentMethod,
      });

      selectedItems.forEach((element) => {
        updateInventoryRowStatus(element?.id, element?.status);
      });

      for (const element of selectedItems) {
        if (!element?.profile_id) {
          await createPayments({
            inventory_id: element?.id,
            description: element?.description,
            orgId: perfil[0]?.organization_id,
            total_amout: element.price * 0.6,
            providerId: element?.provider_id,
            barcode: element.barcode,
          });
        }
      }

      if (paymentMethod === "transferencia") {
        await createInvoices({
          orgId: perfil[0]?.organization_id,
          total_amout: selectedTotal,
        });
      }

      setSelectedItems([]);
      setPaymentMethod("");
      setSearchTerm("");
      if (onSaleCreated) onSaleCreated();
      onClose();
    } catch (err) {
      console.error("Error cargando venta:", err);
      setError(err.response?.data?.error || "No se pudo guardar la venta.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div
        className="modal-container modal-lg"
        style={{ maxHeight: "95vh", display: "flex", flexDirection: "column" }}
      >
        {/* ── Header ── */}
        <div className="modal-header" style={{ flexShrink: 0 }}>
          <div>
            <h2 className="modal-title">Nueva Venta</h2>
            <p className="modal-subtitle">
              Busca productos por código o descripción y elige el método de pago.
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

        {/* ── Body ── */}
        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}
        >
          <div
            className="modal-body"
            style={{
              flex: 1,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
              paddingBottom: "0.5rem",
            }}
          >
            {error && <div className="alert alert-error" style={{ flexShrink: 0 }}>{error}</div>}

            {/* ── Layout 2 columnas ── */}
            <div
              className="sales-modal-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 260px",
                gap: "1.25rem",
                flex: 1,
                overflow: "hidden",
                minHeight: 0,
              }}
            >
              {/* ─── Columna izquierda: búsqueda + lista ─── */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                  overflow: "hidden",
                  minHeight: 0,
                }}
              >
                {/* Buscador */}
                <div style={{ flexShrink: 0 }}>
                  <label htmlFor="buscar-producto" className="label" style={{ color: "var(--primary)" }}>
                    Buscar producto
                  </label>
                  <input
                    id="buscar-producto"
                    className="input"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(normalizeBarcodeSearch(e.target.value))}
                    placeholder="Código de barras o descripción..."
                    disabled={loading || isLoadingInventory}
                    autoComplete="off"
                    autoFocus
                  />
                </div>

                {/* Resultados de búsqueda (dropdown estilo) */}
                {searchTerm.trim() !== "" && (
                  <div
                    style={{
                      flexShrink: 0,
                      border: "1px solid var(--border)",
                      borderRadius: "0.5rem",
                      overflow: "hidden",
                      background: "var(--bg-surface)",
                    }}
                  >
                    {isLoadingInventory ? (
                      <p style={{ padding: "0.75rem", color: "var(--text-muted)", margin: 0, fontSize: "0.875rem" }}>
                        Cargando productos...
                      </p>
                    ) : availableItems.length === 0 ? (
                      <p style={{ padding: "0.75rem", color: "var(--text-muted)", margin: 0, fontSize: "0.875rem" }}>
                        Sin resultados disponibles.
                      </p>
                    ) : (
                      availableItems.map((item, i) => (
                        <div
                          key={item.id}
                          className="search-result-item"
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "0.6rem 0.75rem",
                            borderTop: i > 0 ? "1px solid var(--border)" : undefined,
                          }}
                        >
                          <div>
                            <span style={{ fontWeight: 600, fontSize: "0.875rem" }}>
                              {item.barcode || "Sin código"}
                            </span>
                            {" — "}
                            <span style={{ fontSize: "0.875rem" }}>{item.description}</span>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.125rem" }}>
                              {item.providerName || "Mío"} · <strong>{formatPrice(item.price)}</strong>
                            </div>
                          </div>
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => handleAddItem(item)}
                            style={{ flexShrink: 0, marginLeft: "0.5rem" }}
                          >
                            + Agregar
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Lista de prendas seleccionadas */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem", flex: 1, overflow: "hidden", minHeight: 0 }}>
                  <p className="label" style={{ color: "var(--primary)", margin: 0, flexShrink: 0 }}>
                    Prendas agregadas ({selectedItems.length})
                  </p>

                  {selectedItems.length === 0 ? (
                    <div className="empty-state" style={{ flex: 1 }}>
                      Ninguna prenda agregada aún.
                    </div>
                  ) : (
                    <div
                      style={{
                        flex: 1,
                        overflowY: "auto",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.375rem",
                        paddingRight: "0.25rem",
                      }}
                    >
                      {selectedItems.map((item) => (
                        <div
                          key={item.id}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "0.5rem 0.75rem",
                            background: "var(--bg-surface-2)",
                            border: "1px solid var(--border)",
                            borderRadius: "0.375rem",
                            gap: "0.5rem",
                          }}
                        >
                          <div style={{ minWidth: 0 }}>
                            <p style={{ margin: 0, fontWeight: 500, fontSize: "0.875rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {item.description || "-"}
                            </p>
                            <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-muted)" }}>
                              {item.barcode || "Sin código"} · {formatPrice(item.price)}
                            </p>
                          </div>
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            onClick={() => handleRemoveItem(item.id)}
                            style={{ flexShrink: 0 }}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* ─── Columna derecha: precio total + métodos de pago ─── */}
              <div
                className="sales-modal-sidebar"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.875rem",
                  borderLeft: "1px solid var(--border)",
                  paddingLeft: "1.25rem",
                }}
              >
                {/* Total bruto */}
                <div>
                  <p className="label" style={{ color: "var(--primary)", margin: "0 0 0.5rem" }}>
                    Resumen de precios
                  </p>
                  <div className="price-card price-card--bruto" aria-label="Total bruto">
                    <p className="price-card-label">Total bruto</p>
                    <p className="price-card-value">{formatPrice(totalAmount)}</p>
                    <p className="price-card-discount">sin descuento</p>
                  </div>
                </div>

                {/* Separador */}
                <p style={{ margin: "0", fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Método de pago
                </p>

                {/* Efectivo */}
                <button
                  type="button"
                  className={`price-card price-card--efectivo ${paymentMethod === "efectivo" ? "is-selected" : ""}`}
                  onClick={() => handlePriceCardClick("efectivo")}
                  aria-pressed={paymentMethod === "efectivo"}
                >
                  <p className="price-card-label">💵 Efectivo</p>
                  <p className="price-card-value">{formatPrice(efectivoTotal)}</p>
                  <p className="price-card-discount">10% de descuento</p>
                </button>

                {/* Transferencia */}
                <button
                  type="button"
                  className={`price-card price-card--transferencia ${paymentMethod === "transferencia" ? "is-selected" : ""}`}
                  onClick={() => handlePriceCardClick("transferencia")}
                  aria-pressed={paymentMethod === "transferencia"}
                >
                  <p className="price-card-label">📲 Transferencia</p>
                  <p className="price-card-value">{formatPrice(transferenciaTotal)}</p>
                  <p className="price-card-discount">5% de desc. · genera factura</p>
                </button>

                {/* Total a cobrar destacado */}
                <div style={{ marginTop: "auto" }}>
                  <div className="price-total" style={{ flexDirection: "column", alignItems: "flex-start", gap: "0.25rem" }}>
                    <p className="price-total-label">
                      {paymentMethod ? `Total · ${paymentMethod}` : "Total a cobrar"}
                    </p>
                    <p className="price-total-value">{formatPrice(selectedTotal)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Footer ── */}
          <div className="modal-footer" style={{ flexShrink: 0 }}>
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
              disabled={loading || !selectedItems.length || !paymentMethod}
            >
              {loading ? "Guardando…" : "Cargar venta"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
