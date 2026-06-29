import { Fragment, useMemo, useState } from "react";
import ProvidersFormModal from "./ProvidersFormModal.jsx";
import ItemsFormModal from "./ItemsFormModal.jsx";
import ConfirmDeleteModal from "./ConfirmDeleteModal.jsx";
import { deleteProviders, deleteProvider } from "../services/api.js";

function ProvidersTable({
  providers = [],
  inventoryItems = [],
  loading,
  onDataChange,
}) {
  const [expandedProviders, setExpandedProviders] = useState(new Set());
  const [showProvidersModal, setShowProvidersModal] = useState(false);
  const [showItemsModal, setShowItemsModal] = useState(false);
  const [selectedProviderIdx, setSelectedProviderIdx] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const getProviderId = (provider) => `${provider.id || ""}`.trim();

  const inventoryData = Array.isArray(inventoryItems)
    ? inventoryItems
    : inventoryItems?.data ?? [];

  const relatedItemsByProvider = useMemo(() => {
    return inventoryData.reduce((acc, item) => {
      const providerId = item.provider_id;
      if (!acc[providerId]) acc[providerId] = [];
      acc[providerId].push(item);
      return acc;
    }, {});
  }, [inventoryData]);

  const providerRows = useMemo(() => {
    return providers.map((provider) => {
      const fullId = getProviderId(provider);
      const relatedItems = relatedItemsByProvider[fullId] || [];
      const totalPrice = relatedItems.reduce(
        (sum, item) => sum + (Number(item.price) || 0),
        0,
      );
      const soldCount = relatedItems.filter(
        (item) => (item.status || "").toUpperCase() === "SOLD",
      ).length;
      return {
        provider,
        relatedItems,
        productsCount: relatedItems.length,
        soldCount,
        totalGain: totalPrice * 0.6,
      };
    });
  }, [providers, relatedItemsByProvider]);

  const toggleProvider = (providerName) => {
    setExpandedProviders((prev) => {
      const next = new Set(prev);
      if (next.has(providerName)) next.delete(providerName);
      else next.add(providerName);
      return next;
    });
  };

  const formatPrice = (value) => {
    const cleaned = value?.toString().trim();
    if (!cleaned) return "-";
    const amount = Number(cleaned);
    return Number.isFinite(amount) ? `$ ${amount.toLocaleString("es-AR")}` : "-";
  };

  const handleAddItemClick = (providerIdx) => {
    setSelectedProviderIdx(providerIdx);
    setShowItemsModal(true);
  };

  const handleProvidersModalClose = () => setShowProvidersModal(false);
  const handleItemsModalClose = () => {
    setShowItemsModal(false);
    setSelectedProviderIdx(null);
  };

  const handleProviderAdded = () => onDataChange?.();
  const handleItemsAdded = () => onDataChange?.();

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
      if (prev.size === providerRows.length) return new Set();
      return new Set(providerRows.map((r) => getProviderId(r.provider)));
    });
  };

  const impactCount = useMemo(() => {
    return Array.from(selected).reduce((sum, id) => {
      return sum + (relatedItemsByProvider[id]?.length || 0);
    }, 0);
  }, [selected, relatedItemsByProvider]);

  const handleDeleteClick = () => {
    setError("");
    setConfirmDelete(true);
  };

  const handleDeleteConfirm = async (action) => {
    if (!action) return;
    setDeleting(true);
    setError("");

    try {
      if (selected.size === 1) {
        const id = Array.from(selected)[0];
        await deleteProvider(id);
      } else {
        await deleteProviders({
          ids: Array.from(selected),
          alsoDeleteItems: action === "cascade",
        });
      }
      setSelected(new Set());
      onDataChange?.();
    } catch (err) {
      console.error("Error eliminando proveedoras:", err);
      setError(err.response?.data?.error || "Error al eliminar las proveedoras");
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  if (loading) {
    return <div className="table-state">Cargando proveedoras...</div>;
  }

  const allSelected =
    providerRows.length > 0 && selected.size === providerRows.length;

  if (!providerRows.length) {
    return (
      <div>
        <div className="table-state">No se encontraron proveedoras.</div>
        <ProvidersFormModal
          isOpen={showProvidersModal}
          onClose={handleProvidersModalClose}
          onProviderAdded={handleProviderAdded}
        />
        <ItemsFormModal
          isOpen={showItemsModal}
          onClose={handleItemsModalClose}
          onItemsAdded={handleItemsAdded}
          defaultProviderId={selectedProviderIdx}
        />
      </div>
    );
  }

  const deleteActions = [
    {
      value: "desvincular",
      label: "Solo borrar la(s) proveedora(s)",
      description: `Los ${impactCount} productos asociados quedarán sin proveedora`,
    },
    {
      value: "cascade",
      label: "Borrar proveedora(s) y todos sus productos",
      description: `Borra también los ${impactCount} productos`,
      danger: true,
    },
  ];

  return (
    <div>
      {error && <div className="alert alert-error">{error}</div>}

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
            {selected.size} proveedora{selected.size === 1 ? "" : "s"} seleccionada
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
              onClick={handleDeleteClick}
            >
              ✕ Eliminar seleccionadas
            </button>
          </div>
        </div>
      )}

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: "2.5rem" }}>
                <input
                  type="checkbox"
                  aria-label="Seleccionar todas las proveedoras"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  disabled={!providerRows.length}
                />
              </th>
              <th data-label="Nombre">Nombre</th>
              <th data-label="Teléfono">Teléfono</th>
              <th data-label="Productos">Productos</th>
              <th data-label="Vendidas">Vendidas</th>
              <th data-label="Acciones">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {providerRows.map((row, index) => {
              const displayName = row.provider.first_name || "Sin nombre";
              const isExpanded = expandedProviders.has(displayName);
              const id = getProviderId(row.provider);
              const isSelected = selected.has(id);

              return (
                <Fragment key={`${displayName}-${index}`}>
                  <tr
                    style={{
                      background: isSelected ? "var(--primary-soft)" : undefined,
                    }}
                  >
                    <td data-label="Selección">
                      <input
                        type="checkbox"
                        aria-label={`Seleccionar ${displayName}`}
                        checked={isSelected}
                        onChange={() => toggleSelected(id)}
                      />
                    </td>
                    <td data-label="Nombre">{displayName}</td>
                    <td data-label="Teléfono">{row.provider.phone || "-"}</td>
                    <td data-label="Productos">{row.productsCount}</td>
                    <td data-label="Vendidas">{row.soldCount}</td>
                    <td data-label="Acciones">
                      <div className="flex justify-center gap-2">
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => toggleProvider(displayName)}
                        >
                          {isExpanded ? "Ocultar" : "Ver productos"}
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => handleAddItemClick(index)}
                        >
                          + Producto
                        </button>
                      </div>
                    </td>
                  </tr>

                  {isExpanded && (
                    <tr>
                      <td colSpan={6}>
                        <div style={{ padding: "0.75rem 0" }}>
                          {row.relatedItems.length > 0 ? (
                            <table className="data-table">
                              <thead>
                                <tr>
                                  <th data-label="Código">Código</th>
                                  <th data-label="Descripción">Descripción</th>
                                  <th data-label="Precio">Precio</th>
                                  <th data-label="Estado">Estado</th>
                                  <th data-label="Pagado">Pagado</th>
                                </tr>
                              </thead>
                              <tbody>
                                {row.relatedItems.map((item, itemIndex) => (
                                  <tr
                                    key={`${displayName}-${itemIndex}-${
                                      item.barcode || item.description
                                    }`}
                                  >
                                    <td data-label="Código">
                                      {item.barcode || "-"}
                                    </td>
                                    <td data-label="Descripción">
                                      {item.description || "-"}
                                    </td>
                                    <td data-label="Precio">
                                      {formatPrice(item.price)}
                                    </td>
                                    <td data-label="Estado">
                                      <span
                                        className={`badge ${
                                          (item.status || "").toUpperCase() === "SOLD"
                                            ? "badge-danger"
                                            : "badge-success"
                                        }`}
                                      >
                                        {item.status === "AVAILABLE"
                                          ? "En Stock"
                                          : item.status === "SOLD"
                                            ? "Vendido"
                                            : "-"}
                                      </span>
                                    </td>
                                    <td data-label="Pagado">
                                      <span
                                        className={`badge ${
                                          (item.pago || "").toLowerCase() === "pagado"
                                            ? "badge-success"
                                            : "badge-warning"
                                        }`}
                                      >
                                        {item.pago || "no"}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <div className="empty-state">
                              No hay productos relacionados a esta proveedora.
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
        <ProvidersFormModal
          isOpen={showProvidersModal}
          onClose={handleProvidersModalClose}
          onProviderAdded={handleProviderAdded}
        />
        <ItemsFormModal
          isOpen={showItemsModal}
          onClose={handleItemsModalClose}
          onItemsAdded={handleItemsAdded}
          defaultProviderId={selectedProviderIdx}
          providers={providers}
        />
      </div>

      <ConfirmDeleteModal
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDeleteConfirm}
        title="Eliminar proveedoras"
        count={selected.size}
        entityLabel="proveedora"
        impactSummary={
          impactCount > 0
            ? `Los ${impactCount} productos asociados a las proveedoras seleccionadas también se verán afectados si elegís la opción destructiva.`
            : "Las proveedoras seleccionadas no tienen productos asociados."
        }
        actions={deleteActions}
        loading={deleting}
      />
    </div>
  );
}

export default ProvidersTable;
