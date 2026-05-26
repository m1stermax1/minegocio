import { Fragment, useMemo, useState } from "react";
import ProvidersFormModal from "./ProvidersFormModal.jsx";
import ItemsFormModal from "./ItemsFormModal.jsx";

function ProvidersTable({ items, loading, onDataChange }) {
  const [expandedProviders, setExpandedProviders] = useState(new Set());
  const [showProvidersModal, setShowProvidersModal] = useState(false);
  const [showItemsModal, setShowItemsModal] = useState(false);
  const [selectedProviderIdx, setSelectedProviderIdx] = useState(null);

  const groupedProviders = useMemo(() => {
    const groups = new Map();

    items.forEach((item) => {
      const providerName = item.nombre?.trim() || "Sin nombre";
      const group = groups.get(providerName) || {
        provider: providerName,
        items: [],
        totalPrice: 0,
        soldCount: 0,
        paidCount: 0,
      };

      group.items.push(item);
      const price = Number(item.precio) || 0;
      group.totalPrice += price;
      if (item.estado === "vendido") {
        group.soldCount += 1;
      }
      if (item.pago === "pagado") {
        group.paidCount += 1;
      }

      groups.set(providerName, group);
    });

    return Array.from(groups.values()).map((group) => {
      const count = group.items.length;
      return {
        ...group,
        itemsCount: count,
        estado:
          group.soldCount === count
            ? "vendido"
            : group.soldCount > 0
              ? "mixto"
              : "en stock",
        pago:
          group.paidCount === count
            ? "pagado"
            : group.paidCount > 0
              ? "parcial"
              : "impago",
      };
    });
  }, [items]);

  const toggleProvider = (provider) => {
    setExpandedProviders((prev) => {
      const next = new Set(prev);
      if (next.has(provider)) {
        next.delete(provider);
      } else {
        next.add(provider);
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
      ? `$ ${Math.round(amount * 1000).toLocaleString("es-AR")}`
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

  if (!groupedProviders.length) {
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
              <th>Prendas</th>
              <th>Vendidas</th>
              <th>% Ganancia</th>
              <th>Último pago</th>
            </tr>
          </thead>
          <tbody>
            {groupedProviders.map((group) => {
              const isExpanded = expandedProviders.has(group.provider);
              return (
                <Fragment key={group.provider}>
                  <tr className="provider-group-row">
                    <td>
                      <button
                        type="button"
                        className="expand-btn"
                        onClick={() => toggleProvider(group.provider)}
                        aria-expanded={isExpanded}
                        aria-label={`Ver items de ${group.provider}`}
                      >
                        {isExpanded ? "−" : "+"}
                      </button>
                      {group.provider}
                    </td>
                    <td>{group.items?.length}</td>
                    <td>{group.soldCount}</td>
                    <td>{formatPrice(group.totalPrice * 0.6)}</td>

                    <td>
                      <span
                        className={`payment-badge ${group.pago === "pagado" ? "paid" : "unpaid"}`}
                      >
                        Sáb, 16 de Mayo
                      </span>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr className="provider-expansion-row">
                      <td colSpan={5}>
                        <div className="provider-items-table-wrapper">
                          <table className="inventory-table provider-items-table">
                            <thead>
                              <tr>
                                <th>Código</th>
                                <th>Descripción</th>
                                <th>Precio</th>
                                <th>Proveedor</th>
                                <th>Estado</th>
                                <th>Pagado</th>
                              </tr>
                            </thead>
                            <tbody>
                              {group.items.map((item, index) => {
                                const precioValue = Number(item.precio);
                                return (
                                  <tr
                                    key={`${group.provider}-${index}-${item.codigo || item.descripcion}`}
                                    className="provider-item-row"
                                  >
                                    <td>{item.codigo || "-"}</td>
                                    <td>{item.descripcion || "-"}</td>
                                    <td>{formatPrice(item.precio)}</td>
                                    <td>{group.provider}</td>
                                    <td>
                                      <span
                                        className={`status-badge ${item.estado === "vendido" ? "vendido" : "stock"}`}
                                      >
                                        {item.estado || "-"}
                                      </span>
                                    </td>
                                    <td>
                                      <span
                                        className={`payment-badge ${item.pagado === "si" ? "paid" : "unpaid"}`}
                                      >
                                        {item.pagado || "no"}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
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
        />
      </div>
    </div>
  );
}

export default ProvidersTable;
