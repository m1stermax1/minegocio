import { useState, useEffect } from "react";
import {
  addInventoryItem,
  fetchProviders,
  fetchProfiles,
  printBarcode,
} from "../services/api.js";

function ItemsFormModal({
  isOpen,
  onClose,
  onItemsAdded,
  defaultProviderId,
  providersRefresh,
  providers: parentProviders = [],
}) {
  const [providers, setProviders] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [items, setItems] = useState([]);
  const [newItemName, setNewItemName] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sheetUrl, setSheetUrl] = useState("");
  const [printLabel, setPrintLabel] = useState(true);
  const [printStatus, setPrintStatus] = useState(""); // "", "printing", "ok", "partial", "failed"

  useEffect(() => {
    if (!isOpen) return;
    if (parentProviders?.data?.length > 0) {
      setProviders(parentProviders);
      return;
    }
    (async () => {
      try {
        const data = await fetchProviders();
        setProviders(data || []);
        const profiles = await fetchProfiles();
        const filterProfileByOwner = profiles?.filter(
          (profile) => profile?.role == "ADMIN" || profile.role == "OWNER",
        )[0];
        setSelectedProvider(filterProfileByOwner);
      } catch (err) {
        console.error("Error cargando proveedoras:", err);
      }
    })();
  }, [isOpen, providersRefresh, parentProviders, defaultProviderId]);

  useEffect(() => {
    if (!isOpen) {
      setItems([]);
      setNewItemName("");
      setNewItemPrice("");
      setError("");
      setPrintStatus("");
    }
  }, [isOpen]);

  const handleAddItem = () => {
    if (!sheetUrl) {
      if (!newItemName.trim() || !newItemPrice.toString().trim()) {
        setError("Nombre y precio son obligatorios");
        return;
      }
    }

    const priceNum = parseFloat(newNewItemPriceSafe(newItemPrice));
    if (Number.isNaN(priceNum)) {
      setError("Precio inválido");
      return;
    }

    setItems((prev) => [
      ...prev,
      { id: Date.now(), nombre: newItemName.trim(), precio: priceNum },
    ]);

    setNewItemName("");
    setNewItemPrice("");
    setError("");
  };

  const newNewItemPriceSafe = (v) => v.toString().replace(/,/g, ".");

  const handleRemoveItem = (id) =>
    setItems((prev) => prev.filter((it) => it.id !== id));

  const generateWhatsAppMessage = () => {
    if (!items.length || !selectedProvider) return "";

    let message = `Hola, te paso el detalle de las prendas:\n\n`;
    items.forEach((item) => {
      message += `${item.nombre} - $${item.precio.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}\n`;
    });
    message += `\n*Del valor de cada prenda el 60% sería para vos!*\n\n*Si se vende algo durante la semana te estaremos contactando el día Sábado para realizar la transferencia o nos avisas si lo retiras durante la semana!*`;
    return message;
  };

  const generateWhatsAppLink = () => {
    const message = generateWhatsAppMessage();
    const encodedMessage = encodeURIComponent(message);
    const phone = (selectedProvider?.telefono || "").replace(/\D/g, "");
    return `https://wa.me/${phone}?text=${encodedMessage}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setPrintStatus("");
    if (!selectedProvider) return setError("Selecciona una proveedora");
    if (!items?.length && !sheetUrl) return setError("Agrega al menos un item");

    setLoading(true);
    try {
      let itemsToAdd;
      if (!sheetUrl) {
        itemsToAdd = items.map((item) => ({
          nombre: item.nombre,
          precio: item.precio.toString(),
          proveedora: selectedProvider?.id,
          orgId: selectedProvider?.organization_id,
          providerName: selectedProvider?.first_name,
        }));
      } else {
        const SHEET_ID = sheetUrl?.match(/\/d\/([^/]+)/)?.[1];
        const SHEET_NAME = "LOCAL MAXI";
        const response = await fetch(
          `https://opensheet.elk.sh/${SHEET_ID}/${SHEET_NAME}`,
        );
        const data = await response.json();
        itemsToAdd = data.map((row) => ({
          nombre: row.Nombre,
          precio: Number(row.Precio * 1000),
          proveedora: selectedProvider?.id,
          orgId: selectedProvider?.organization_id,
          providerName: selectedProvider?.first_name || selectedProvider?.name,
        }));
      }

      const result = await addInventoryItem(itemsToAdd);
      const barcodes = result?.barcodes || [];

      // Si el checkbox está activo y hay códigos, disparar impresión
      if (printLabel && barcodes.length > 0) {
        setPrintStatus("printing");
        const results = await Promise.allSettled(
          barcodes.map((bc) => printBarcode(bc.codigo ?? bc)),
        );
        const okCount = results.filter((r) => r.status === "fulfilled").length;
        if (okCount === barcodes.length) setPrintStatus("ok");
        else if (okCount === 0) setPrintStatus("failed");
        else setPrintStatus("partial");
      }

      setItems([]);
      setNewItemName("");
      setNewItemPrice("");
      setSelectedProvider("");
      onItemsAdded?.();
      const whatsappLink = generateWhatsAppLink();
      window.open(whatsappLink, "_blank");
      onClose();
    } catch (err) {
      console.error("Error agregando items:", err);
      setError(err.message || "Error al agregar los items");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const total = items.reduce((s, it) => s + it.precio, 0);

  return (
    <div className="modal-backdrop">
      <div className="modal-container modal-md">
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Agregar Productos</h2>
            <p className="modal-subtitle">
              Agrega productos manualmente o desde un excel público
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
            {printStatus === "failed" && (
              <div className="alert alert-warning">
                Productos creados, pero no se pudieron imprimir las etiquetas.
              </div>
            )}
            {printStatus === "partial" && (
              <div className="alert alert-warning">
                Productos creados. Algunas etiquetas no se imprimieron.
              </div>
            )}

            {/* Selección de proveedora */}
            <div>
              <label className="label" htmlFor="provider-select">
                Proveedora <span style={{ color: "var(--danger)" }}>*</span>
              </label>
              <select
                id="provider-select"
                className="select"
                value={selectedProvider?.id ?? ""}
                onChange={(e) => {
                  const id = e.target.value;
                  setSelectedProvider(
                    providers?.data?.find((prov) => prov.id === id) || null,
                  );
                }}
                disabled={loading}
              >
                <option value="">Selecciona una proveedora</option>
                {providers?.data?.map((prov) => (
                  <option key={prov.id} value={prov.id}>
                    {prov.first_name} {prov.last_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Carga desde excel */}
            <details
              style={{
                border: "1px solid var(--border)",
                borderRadius: "0.5rem",
                background: "var(--bg-surface-2)",
              }}
            >
              <summary
                style={{
                  padding: "0.75rem 1rem",
                  cursor: "pointer",
                  fontWeight: 500,
                  fontSize: "0.875rem",
                  listStyle: "none",
                }}
              >
                📊 Cargar desde Excel público (opcional)
              </summary>
              <div style={{ padding: "0 1rem 1rem" }}>
                <label className="label-muted" htmlFor="sheet-url">
                  URL del Google Sheet
                </label>
                <input
                  id="sheet-url"
                  type="text"
                  className="input"
                  value={sheetUrl}
                  onChange={(e) => setSheetUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  disabled={loading}
                />
                <p
                  style={{
                    margin: "0.5rem 0 0",
                    fontSize: "0.75rem",
                    color: "var(--text-muted)",
                  }}
                >
                  Hoja "LOCAL MAXI" — columnas: Nombre, Precio.
                </p>
              </div>
            </details>

            {/* Inputs de producto individual */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 140px",
                gap: "0.75rem",
              }}
            >
              <div>
                <label className="label" htmlFor="item-name">
                  Nombre del Producto
                </label>
                <input
                  id="item-name"
                  type="text"
                  className="input"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="Ej: Remera azul"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="label" htmlFor="item-price">
                  Precio
                </label>
                <input
                  id="item-price"
                  type="number"
                  className="input"
                  value={newItemPrice}
                  onChange={(e) => setNewItemPrice(e.target.value)}
                  placeholder="1500"
                  step="0.01"
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleAddItem}
              disabled={loading}
            >
              + Agregar a la lista
            </button>

            {/* Lista de productos cargados */}
            {items.length > 0 && (
              <div
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: "0.5rem",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    padding: "0.625rem 1rem",
                    background: "var(--bg-surface-2)",
                    borderBottom: "1px solid var(--border)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <h3
                    style={{
                      margin: 0,
                      fontSize: "0.8125rem",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      color: "var(--text-muted)",
                    }}
                  >
                    Productos en la lista ({items.length})
                  </h3>
                </div>
                <div
                  style={{
                    display: "grid",
                    gap: "0.375rem",
                    padding: "0.5rem",
                    maxHeight: 220,
                    overflowY: "auto",
                  }}
                >
                  {items.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "0.625rem 0.75rem",
                        background: "var(--bg-surface-2)",
                        borderRadius: "0.375rem",
                      }}
                    >
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <p
                          style={{
                            margin: 0,
                            fontWeight: 600,
                            fontSize: "0.9375rem",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {item.nombre}
                        </p>
                        <p
                          style={{
                            margin: 0,
                            color: "var(--text-muted)",
                            fontSize: "0.8125rem",
                          }}
                        >
                          ${item.precio.toLocaleString("es-AR")}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        style={{ color: "var(--danger)" }}
                        onClick={() => handleRemoveItem(item.id)}
                        disabled={loading}
                        aria-label={`Quitar ${item.nombre}`}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div
                  style={{
                    padding: "0.75rem 1rem",
                    background: "var(--success-bg)",
                    borderTop: "1px solid var(--border)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.8125rem",
                      fontWeight: 600,
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Total estimado
                  </span>
                  <strong
                    style={{
                      fontSize: "1.25rem",
                      color: "var(--success)",
                    }}
                  >
                    ${total.toLocaleString("es-AR")}
                  </strong>
                </div>
              </div>
            )}

            {/* Checkbox imprimir etiqueta */}
            <label className="checkbox" htmlFor="print-label">
              <input
                id="print-label"
                type="checkbox"
                checked={printLabel}
                onChange={(e) => setPrintLabel(e.target.checked)}
                disabled={loading}
              />
              <span className="checkbox-box" aria-hidden="true" />
              <span className="checkbox-label">
                <span>Imprimir etiquetas al guardar</span>
                <span className="checkbox-label-hint">
                  Envía cada código de barra a la impresora (COM3) al crear
                </span>
              </span>
            </label>
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
              {loading
                ? printStatus === "printing"
                  ? "Imprimiendo etiquetas..."
                  : "Enviando..."
                : "✓ Guardar y Enviar por WhatsApp"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ItemsFormModal;