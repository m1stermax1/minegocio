import { Fragment, useMemo, useState } from "react";
import ProvidersFormModal from "./ProvidersFormModal.jsx";
import ItemsFormModal from "./ItemsFormModal.jsx";

function ProvidersTable({ providers = [], inventoryItems = [], loading, onDataChange }) {
  const [expandedProviders, setExpandedProviders] = useState(new Set());
  const [showProvidersModal, setShowProvidersModal] = useState(false);
  const [showItemsModal, setShowItemsModal] = useState(false);
  const [selectedProviderIdx, setSelectedProviderIdx] = useState(null);

  const normalize = (value) => (value || "").toString().trim().toLowerCase();

  const getProviderFullName = (provider) =>
    `${provider.nombre || ""} ${provider.apellido || ""}`.trim();

  const providerKeyByLowerName = useMemo(() => {
    const mapping = new Map();
    providers.forEach((provider) => {
      const fullName = getProviderFullName(provider);
      const lowerFullName = normalize(fullName);
      const lowerName = normalize(provider.nombre);

      if (lowerName) {
        mapping.set(lowerName, fullName);
      }
      if (lowerFullName) {
        mapping.set(lowerFullName, fullName);
      }
    });
    return mapping;
  }, [providers]);

  const relatedItemsByProvider = useMemo(() => {
    const result = new Map();

    inventoryItems.forEach((item) => {
      const itemProvider = normalize(item.proveedora);
      const mappedProvider = providerKeyByLowerName.get(itemProvider) || itemProvider;
      const providerName = mappedProvider || "Sin nombre";

      if (!result.has(providerName)) {
        result.set(providerName, []);
      }
      result.get(providerName).push(item);
    });

    return result;
  }, [inventoryItems, providerKeyByLowerName]);

  const providerRows = useMemo(() => {
    return providers.map((provider) => {
      const fullName = getProviderFullName(provider);
      const relatedItems = relatedItemsByProvider.get(fullName) || [];
      const totalPrice = relatedItems.reduce(
        (sum, item) => sum + (Number(item.precio) || 0),
        0,
      );
      const soldCount = relatedItems.filter(
        (item) => (item.estado || "").toLowerCase() === "vendido",
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
      if (next.has(providerName)) {
        next.delete(providerName);
      } else {
        next.add(providerName);
      }
      return next;
    });
  };

  const formatPrice = (value) => {
    const cleaned = value?.toString().trim();
    if (!cleaned) {
      return "-";
    }

    const amount = Number(cleaned);
    return Number.isFinite(amount)
      ? `$ ${amount.toLocaleString("es-AR")}`
      : "-";
  };

  const handleAddItemClick = (providerIdx) => {
    setSelectedProviderIdx(providerIdx);
    setShowItemsModal(true);
  };

  const handleProvidersModalClose = () => {
    setShowProvidersModal(false);
  };

  const handleItemsModalClose = () => {
    setShowItemsModal(false);
    setSelectedProviderIdx(null);
  };

  const handleProviderAdded = () => {
    if (onDataChange) {
      onDataChange();
    }
  };

  const handleItemsAdded = () => {
    if (onDataChange) {
      onDataChange();
    }
  };

  if (loading) {
    return <div className="table-state">Cargando proveedoras...</div>;
  }

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

  return (
    <div>
      <div className="table-wrapper">
        <table className="table providers-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Teléfono</th>
              <th>Productos</th>
              <th>Vendidas</th>
              <th>Total para proveedora</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {providerRows.map((row, index) => {
              const fullName = getProviderFullName(row.provider);
              const displayName = fullName || row.provider.nombre || "Sin nombre";
              const isExpanded = expandedProviders.has(displayName);

              return (
                <Fragment key={`${displayName}-${index}`}>
                  <tr className="provider-group-row">
                    <td>{displayName}</td>
                    <td>{row.provider.telefono || "-"}</td>
                    <td>{row.productsCount}</td>
                    <td>{row.soldCount}</td>
                    <td>{formatPrice(row.totalGain)}</td>
                    <td>
                      <button
                        type="button"
                        className="secondary-btn"
                        onClick={() => toggleProvider(displayName)}
                      >
                        {isExpanded ? "Ocultar" : "Ver productos"}
                      </button>
                      <button
                        type="button"
                        className="secondary-btn"
                        onClick={() => handleAddItemClick(index)}
                        style={{ marginLeft: "8px" }}
                      >
                        + Producto
                      </button>
                    </td>
                  </tr>

                  {isExpanded && (
                    <tr className="provider-expansion-row">
                      <td colSpan={6}>
                        <div className="provider-items-table-wrapper">
                          {row.relatedItems.length > 0 ? (
                            <table className="inventory-table provider-items-table">
                              <thead>
                                <tr>
                                  <th>Código</th>
                                  <th>Descripción</th>
                                  <th>Precio</th>
                                  <th>Estado</th>
                                  <th>Pagado</th>
                                </tr>
                              </thead>
                              <tbody>
                                {row.relatedItems.map((item, itemIndex) => (
                                  <tr
                                    key={`${displayName}-${itemIndex}-${item.codigo || item.descripcion}`}
                                    className="provider-item-row"
                                  >
                                    <td>{item.codigo || "-"}</td>
                                    <td>{item.descripcion || "-"}</td>
                                    <td>{formatPrice(item.precio)}</td>
                                    <td>
                                      <span
                                        className={`status-badge ${
                                          item.estado === "vendido" ? "vendido" : "stock"
                                        }`}
                                      >
                                        {item.estado || "-"}
                                      </span>
                                    </td>
                                    <td>
                                      <span
                                        className={`payment-badge ${
                                          (item.pago || "").toLowerCase() === "pagado"
                                            ? "paid"
                                            : "unpaid"
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
                            <div className="table-state">No hay productos relacionados a esta proveedora.</div>
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
    </div>
  );
}

export default ProvidersTable;
