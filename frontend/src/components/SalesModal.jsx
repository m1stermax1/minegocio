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
  const [notification, setNotification] = useState("");
  const [cashAmount, setCashAmount] = useState("");
  const [transferAmount, setTransferAmount] = useState("");

  const availableItems = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const safeItems = Array.isArray(inventoryItems) ? inventoryItems : [];
    if (!term) return [];
    return safeItems
      ?.filter((item) => item?.status == "AVAILABLE")
      ?.filter((item) => {
        if (!item?.description) return false;
        const isSold = (item?.status || "").toUpperCase() === "SOLD";
        if (isSold) return false;
        const alreadySelected = selectedItems.some(
          (selected) => selected.id === item.id,
        );
        if (alreadySelected) return false;
        const codigo = item.barcode?.toLowerCase() || "";
        const descripcion = item.description?.toLowerCase() || "";
        return codigo.includes(term) || descripcion.includes(term);
      })
      .slice(0, 10);
  }, [inventoryItems, searchTerm, selectedItems]);

  const totalAmount = selectedItems.reduce((sum, item) => {
    const value =
      Number(item?.profile == null ? item.price : item.price * 0.6) || 0;
    return sum + value;
  }, 0);

  const efectivoTotal = totalAmount * 0.9;
  const transferenciaTotal = totalAmount * 0.95;
  const tarjetaTotal = totalAmount * 0.9441;
  const selectedTotal =
    paymentMethod === "efectivo"
      ? efectivoTotal
      : paymentMethod === "transferencia"
        ? transferenciaTotal
        : paymentMethod === "debito/credito"
          ? tarjetaTotal
          : paymentMethod === "mixto"
            ? mixedTotal
            : totalAmount;

  const cashValue = Number(cashAmount) || 0;

  const discountedCash = cashValue * 0.9;
  const remainingAmount = Math.max(totalAmount - cashValue, 0);
  const calculatedTransfer = remainingAmount * 0.95;

  const mixedTotal = discountedCash + calculatedTransfer;
  const handleAddItem = (item) => {
    setError("");
    setSelectedItems((prev) => {
      if (prev.some((selected) => selected.id === item.id)) return prev;
      return [...prev, item];
    });
    setSearchTerm("");
  };

  const handleRemoveItem = (id) => {
    setSelectedItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Atajo: click en una price card también setea el método de pago
  const handlePriceCardClick = (method) => {
    setPaymentMethod(method);
  };

  useEffect(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term || availableItems.length !== 1) return;
    const item = availableItems[0];
    if (
      item.barcode?.toLowerCase() === term &&
      !selectedItems.some((selected) => selected.id === item.id)
    ) {
      handleAddItem(item);
    }
  }, [searchTerm, availableItems, selectedItems]);

  const normalizeBarcodeSearch = (value) => value.replace(/[''‘]/g, "-");

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

      const updatedItems = selectedItems.map((item) => ({
        ...item,
        paymentMethod,
      }));
      await createSalesItem({
        orgId: perfil[0]?.organization_id,
        saleId: salesCreated?.data[0]?.id,
        items: updatedItems,
        totalSaleAmount: selectedTotal,
        paymethod: paymentMethod,
      });

      selectedItems?.forEach((element) => {
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

      if (paymentMethod == "transferencia") {
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
      <div className="modal-container modal-lg">
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Agregar Venta</h2>
            <p className="modal-subtitle">
              Busca productos por código o descripción y agrégalos a la venta.
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
          <div className="modal-body">
            {error && <div className="alert alert-error">{error}</div>}

            <div style={{ marginBottom: "1rem" }}>
              <label
                htmlFor="buscar-producto"
                className="label"
                style={{ color: "var(--primary)" }}
              >
                Buscar producto
              </label>
              <input
                id="buscar-producto"
                className="input"
                value={searchTerm}
                onChange={(e) =>
                  setSearchTerm(normalizeBarcodeSearch(e.target.value))
                }
                placeholder="Escribe el código o descripción del producto..."
                disabled={loading || isLoadingInventory}
                autoComplete="off"
              />
            </div>

            {searchTerm.trim() !== "" && (
              <div style={{ marginBottom: "1.5rem" }}>
                <p
                  className="label"
                  style={{ color: "var(--primary)", marginBottom: "0.5rem" }}
                >
                  Resultados de búsqueda
                </p>
                {isLoadingInventory ? (
                  <p style={{ color: "var(--text-muted)" }}>
                    Cargando productos...
                  </p>
                ) : (
                  <div style={{ maxHeight: 200, overflowY: "auto" }}>
                    {availableItems.length === 0 ? (
                      <p
                        style={{
                          margin: "0.75rem",
                          color: "var(--text-muted)",
                          fontSize: "0.875rem",
                        }}
                      >
                        No se encontraron productos disponibles.
                      </p>
                    ) : (
                      availableItems.map((item) => (
                        <div
                          key={item.id}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "0.75rem",
                            borderRadius: "0.375rem",
                          }}
                          className="search-result-item"
                        >
                          <div>
                            <strong>{item.barcode || "Sin código"}</strong> —{" "}
                            {item.description || "Sin descripción"}
                            <div
                              style={{
                                fontSize: "0.875rem",
                                color: "var(--text-muted)",
                                marginTop: "0.25rem",
                              }}
                            >
                              Proveedor: {item.providerName || "mío"} —{" "}
                              <strong>{formatPrice(item.price)}</strong>
                            </div>
                          </div>
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
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

            <div
              style={{
                display: "flex",
                gap: "1.5rem",
                flexWrap: "wrap",
                marginTop: "0.5rem",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  flex: 1,
                  minWidth: 320,
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                }}
              >
                <h3
                  style={{
                    margin: "0 0 0.25rem",
                    fontSize: "1.1rem",
                    fontWeight: 700,
                  }}
                >
                  Prendas agregadas ({selectedItems.length})
                </h3>
                {selectedItems.length === 0 ? (
                  <div className="empty-state">
                    No se han seleccionado prendas. Busca y agrega una arriba.
                  </div>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.75rem",
                      maxHeight: 350,
                      overflowY: "auto",
                      paddingRight: "0.5rem",
                    }}
                  >
                    {selectedItems.map((item) => (
                      <div
                        key={item.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "0.75rem",
                          background: "var(--bg-surface-2)",
                          border: "1px solid var(--border)",
                          borderRadius: "0.375rem",
                        }}
                      >
                        <span style={{ marginLeft: "0.5rem", fontWeight: 500 }}>
                          {item.description || "-"}
                        </span>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.75rem",
                          }}
                        >
                          <strong style={{ fontSize: "1.125rem" }}>
                            {formatPrice(item.price)}
                          </strong>
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
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

              {/* Resumen de precios destacado */}
              <div
                style={{
                  width: "100%",
                  maxWidth: 360,
                  minWidth: 280,
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                }}
              >
                <div>
                  <p
                    className="label"
                    style={{
                      color: "var(--primary)",
                      marginBottom: 0,
                      fontWeight: 700,
                    }}
                  >
                    Resumen de precios
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "0.75rem",
                      color: "var(--text-muted)",
                    }}
                  >
                    Tocá una opción para elegir el método de pago.
                  </p>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "0.75rem",
                  }}
                >
                  {/* Total bruto (referencia, no clickeable) */}
                  <div
                    className="price-card price-card--bruto"
                    aria-label="Total bruto"
                  >
                    <p className="price-card-label">Total bruto</p>
                    <p className="price-card-value">
                      {formatPrice(totalAmount)}
                    </p>
                    <p className="price-card-discount">sin descuento</p>
                  </div>

                  {/* Efectivo */}
                  <button
                    type="button"
                    className={`price-card price-card--efectivo ${
                      paymentMethod === "efectivo" ? "is-selected" : ""
                    }`}
                    onClick={() => handlePriceCardClick("efectivo")}
                    aria-pressed={paymentMethod === "efectivo"}
                  >
                    <p className="price-card-label">Efectivo</p>
                    <p className="price-card-value">
                      {formatPrice(efectivoTotal)}
                    </p>
                    <p className="price-card-discount">10% de descuento</p>
                  </button>

                  {/* Transferencia */}
                  <button
                    type="button"
                    className={`price-card price-card--transferencia ${
                      paymentMethod === "transferencia" ? "is-selected" : ""
                    }`}
                    onClick={() => handlePriceCardClick("transferencia")}
                    aria-pressed={paymentMethod === "transferencia"}
                  >
                    <p className="price-card-label">Transferencia</p>
                    <p className="price-card-value">
                      {formatPrice(transferenciaTotal)}
                    </p>
                    <p className="price-card-discount">
                      5% de descuento · genera factura
                    </p>
                  </button>

                  <button
                    type="button"
                    className={`price-card ${
                      paymentMethod === "mixto" ? "is-selected" : ""
                    }`}
                    onClick={() => handlePriceCardClick("mixto")}
                    aria-pressed={paymentMethod === "mixto"}
                  >
                    <p className="price-card-label">Pago Mixto</p>
                    <p className="price-card-value">
                      {formatPrice(mixedTotal)}
                    </p>
                    <p className="price-card-discount">
                      Efectivo 10% + Transferencia 5%
                    </p>
                  </button>

                  {/* Débito / Crédito */}
                  <button
                    type="button"
                    className={`price-card price-card--debito ${
                      paymentMethod === "debito/credito" ? "is-selected" : ""
                    }`}
                    onClick={() => handlePriceCardClick("debito/credito")}
                    aria-pressed={paymentMethod === "debito/credito"}
                  >
                    <p className="price-card-label">Débito / Crédito</p>
                    <p className="price-card-value">
                      {formatPrice(tarjetaTotal)}
                    </p>
                    <p className="price-card-discount">5,59% de recargo</p>
                  </button>

                  {/* Total final destacado
                  <div className="price-total">
                    <p className="price-total-label">
                      {paymentMethod
                        ? `Total a guardar · ${paymentMethod}`
                        : "Total a guardar"}
                    </p>
                    <p className="price-total-value">
                      {formatPrice(selectedTotal)}
                    </p>
                  </div> */}
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <div className="price-total justify-self-start">
              <p className="price-total-label">
                {paymentMethod
                  ? `Total a guardar · ${paymentMethod}`
                  : "Total a guardar"}
              </p>
              <p className="price-total-value">{formatPrice(selectedTotal)}</p>
            </div>
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
              {loading ? "Guardando..." : "Cargar venta"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
