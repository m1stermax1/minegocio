import { useState, useEffect, useMemo, forwardRef, useImperativeHandle } from "react";
import {
  fetchProviders,
  addInventoryItem,
  sendWhatsAppMessage,
  printBarcode,
  deleteInventoryItem,
  deleteInventoryItems,
} from "../services/api.js";
import ConfirmDeleteModal from "./ConfirmDeleteModal.jsx";

const InventoryTable = forwardRef(function InventoryTable(
  { items, loading, onItemAdded, providers = [] },
  ref,
) {
  const [tableItems, setTableItems] = useState([]);
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [pendingItems, setPendingItems] = useState([
    { nombre: "", precio: "", proveedora: "" },
  ]);
  const [generatedBarcodes, setGeneratedBarcodes] = useState([]);
  const [showModal, setShowModal] = useState(false);

  // Selección múltiple + delete (deben estar ANTES de cualquier return condicional)
  const [selected, setSelected] = useState(new Set());
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    setTableItems(items);
  }, [items]);

  useImperativeHandle(ref, () => ({
    openAddItemModal: () => {
      setFormError("");
      setPendingItems([{ nombre: "", precio: "", proveedora: "" }]);
      setGeneratedBarcodes([]);
      setShowModal(true);
    },
  }));

  const impact = useMemo(() => {
    const ids = Array.from(selected);
    const selectedItems = tableItems.filter((i) => ids.includes(`${i.id}`));
    const soldCount = selectedItems.filter(
      (i) => (i.status || "").toUpperCase() === "SOLD",
    ).length;
    return { total: selectedItems.length, sold: soldCount };
  }, [selected, tableItems]);

  if (loading) {
    return <div className="table-state">Cargando inventario...</div>;
  }

  const hasItems = tableItems?.length > 0;

  const formatInventoryPrice = (value) => {
    const amount = Number(value);
    return Number.isFinite(amount)
      ? `$ ${amount.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
      : "-";
  };

  const formatText = (value) => value?.toString().trim() || "-";

  const openModal = () => {
    setFormError("");
    setPendingItems([{ nombre: "", precio: "", proveedora: "" }]);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setFormError("");
  };

  const handleItemChange = (index, field, value) => {
    setPendingItems((prev) =>
      prev.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    );
  };

  const addPendingItemRow = () => {
    const lastProveedora = pendingItems[pendingItems.length - 1]?.proveedora || "";
    setPendingItems((prev) => [
      ...prev,
      { nombre: "", precio: "", proveedora: lastProveedora },
    ]);
  };

  const removePendingItemRow = (index) => {
    setPendingItems((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");

    if (
      pendingItems.some(
        (item) =>
          !item.nombre.trim() ||
          !item.precio.toString().trim() ||
          !item.proveedora.trim(),
      )
    ) {
      setFormError("Completa todos los campos antes de agregar los items.");
      return;
    }

    const itemsToSend = pendingItems.map((item) => {
      const precioNumero = Number(item.precio.toString().replace(/,/g, "."));
      if (Number.isNaN(precioNumero)) throw new Error("Precio inválido");
      return {
        nombre: item.nombre.trim(),
        precio: precioNumero,
        proveedora: item.proveedora.trim(),
      };
    });

    setIsSaving(true);
    try {
      const result = await addInventoryItem(itemsToSend);
      const barcodes = result.barcodes || [];
      setGeneratedBarcodes(barcodes);
      try {
        await sendWhatsAppMessage({ barcodes });
      } catch (whError) {
        console.error("Error sending WhatsApp message:", whError);
      }
      closeModal();
      onItemAdded?.();
    } catch (error) {
      console.error("Error agregando item en Sheets:", error);
      setFormError(
        error?.message?.includes("Precio inválido")
          ? "Al menos un precio es inválido."
          : "No se pudo agregar el item. Intenta de nuevo.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleBarcodeImpresion = async (barcode) => {
    await printBarcode(barcode);
  };

  const toggleSelected = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelected((prev) => {
      if (prev.size === tableItems.length) return new Set();
      return new Set(tableItems.map((i) => `${i.id}`));
    });
  };

  const handleDeleteConfirm = async (action) => {
    if (!action) return;
    setDeleting(true);
    setDeleteError("");

    try {
      if (selected.size === 1) {
        const id = Array.from(selected)[0];
        await deleteInventoryItem(id);
      } else {
        await deleteInventoryItems({
          ids: Array.from(selected),
          onlyAvailable: action === "available",
        });
      }
      setSelected(new Set());
      onItemAdded?.();
    } catch (err) {
      console.error("Error eliminando items:", err);
      setDeleteError(
        err.response?.data?.error || "Error al eliminar los items",
      );
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const deleteActions = [
    {
      value: "available",
      label: "Solo borrar los disponibles",
      description: `Mantiene los items ya vendidos. ${
        impact.sold > 0
          ? `${impact.sold} vendido(s) se conservarán.`
          : "Ninguno vendido entre los seleccionados."
      }`,
    },
    {
      value: "all",
      label: "Borrar todos (incluye vendidos)",
      description: `Borra los ${impact.total} items seleccionados, sin importar su estado.`,
      danger: true,
    },
  ];

  const allSelected =
    tableItems.length > 0 && selected.size === tableItems.length;

  return (
    <div>
      {deleteError && (
        <div className="alert alert-error">{deleteError}</div>
      )}

      {/* Toolbar con botón eliminar */}
      {selected.size > 0 && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0.75rem 1rem",
            background: "var(--bg-surface-2)",
            border: "1px solid var(--border)",
            borderRadius: "0.5rem",
            marginBottom: "0.75rem",
          }}
        >
          <span style={{ fontWeight: 600 }}>
            {selected.size} item{selected.size === 1 ? "" : "s"} seleccionado
            {selected.size === 1 ? "" : "s"}
          </span>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setSelected(new Set())}
            >
              Limpiar
            </button>
            <button
              type="button"
              className="btn btn-danger btn-sm"
              onClick={() => setConfirmDelete(true)}
            >
              ✕ Eliminar seleccionados
            </button>
          </div>
        </div>
      )}

      <div className="table-wrapper">
      {hasItems ? (
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: "2.5rem" }}>
                <input
                  type="checkbox"
                  aria-label="Seleccionar todos los items"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                />
              </th>
              <th data-label="Nombre">Nombre</th>
              <th data-label="Precio">Precio</th>
              <th data-label="Proveedor">Proveedor</th>
              <th data-label="Estado">Estado</th>
              <th data-label="Acciones">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {tableItems.map((item, index) => {
              const id = `${item.id}`;
              const isSelected = selected.has(id);
              return (
                <tr
                  key={`${item.id}-${index}`}
                  style={{
                    background: isSelected ? "var(--primary-soft)" : undefined,
                  }}
                >
                  <td data-label="Selección">
                    <input
                      type="checkbox"
                      aria-label={`Seleccionar ${item.description || item.barcode}`}
                      checked={isSelected}
                      onChange={() => toggleSelected(id)}
                    />
                  </td>
                  <td data-label="Nombre">{formatText(item.description)}</td>
                  <td data-label="Precio">{formatInventoryPrice(item.price)}</td>
                  <td data-label="Proveedor">{formatText(item.providerName)}</td>
                  <td data-label="Estado">
                    <span
                      className={`badge ${
                        item.status?.toLowerCase() === "sold"
                          ? "badge-danger"
                          : "badge-success"
                      }`}
                    >
                      {item.status === "AVAILABLE" ? "En Stock" : "Vendido"}
                    </span>
                  </td>
                  <td data-label="Acciones">
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleBarcodeImpresion(item.barcode)}
                    >
                      Imprimir Etiqueta
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <div className="empty-state">No se encontraron productos.</div>
      )}

      <ConfirmDeleteModal
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDeleteConfirm}
        title="Eliminar productos"
        count={selected.size}
        entityLabel="item"
        impactSummary={
          impact.sold > 0
            ? `De los ${impact.total} items seleccionados, ${impact.sold} ya están vendidos.`
            : `Los ${impact.total} items seleccionados están en stock.`
        }
        actions={deleteActions}
        loading={deleting}
      />

      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-container modal-md">
            <div className="modal-header">
              <div>
                <h2 className="modal-title">Agregar productos manuales</h2>
                <p className="modal-subtitle">
                  Carga uno o varios productos a la vez.
                </p>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-icon"
                onClick={closeModal}
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: "grid", gap: "1rem" }}>
                {formError && <div className="alert alert-error">{formError}</div>}

                {pendingItems.map((item, index) => (
                  <div
                    key={index}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 140px 1fr max-content",
                      gap: "0.5rem",
                      alignItems: "end",
                    }}
                  >
                    <div>
                      <label className="label-muted">Nombre del producto</label>
                      <input
                        className="input"
                        value={item.nombre}
                        onChange={(e) => handleItemChange(index, "nombre", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="label-muted">Precio</label>
                      <input
                        className="input"
                        type="number"
                        step="0.01"
                        value={item.precio}
                        onChange={(e) => handleItemChange(index, "precio", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="label-muted">Proveedora</label>
                      <select
                        className="select"
                        value={item.proveedora}
                        onChange={(e) =>
                          handleItemChange(index, "proveedora", e.target.value)
                        }
                      >
                        <option value="">Selecciona</option>
                        {providers?.data?.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.first_name} {p.last_name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="button"
                      className="btn btn-ghost btn-icon"
                      onClick={() => removePendingItemRow(index)}
                      aria-label="Eliminar fila"
                      disabled={pendingItems.length <= 1}
                    >
                      ✕
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={addPendingItemRow}
                >
                  + Agregar otra fila
                </button>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeModal}
                  disabled={isSaving}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSaving}>
                  {isSaving ? "Guardando..." : "Guardar y enviar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {generatedBarcodes.length > 0 && (
        <div className="card" style={{ marginTop: "1rem" }}>
          <p className="modal-title">Códigos de barra generados</p>
          <ul style={{ marginTop: "0.5rem", paddingLeft: "1rem" }}>
            {generatedBarcodes.map((barcode) => (
              <li key={barcode.codigo}>
                <strong>{barcode.codigo}</strong> —{" "}
                <a href={barcode.url} target="_blank" rel="noreferrer">
                  Descargar SVG
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
      </div>
    </div>
  );
});

export default InventoryTable;