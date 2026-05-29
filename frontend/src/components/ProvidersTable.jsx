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
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-separate border-spacing-3">
          <thead>
            <tr>
              <th className="text-center">Nombre</th>
              <th className="text-center">Teléfono</th>
              <th className="text-center">Productos</th>
              <th className="text-center">Vendidas</th>
              <th className="text-center">Total para proveedora</th>
              <th className="text-center">Acciones</th>
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
                    <td className="text-center">{displayName}</td>
                    <td className="text-center">{row.provider.telefono || "-"}</td>
                    <td className="text-center">{row.productsCount}</td>
                    <td className="text-center">{row.soldCount}</td>
                    <td className="text-center">{formatPrice(row.totalGain)}</td>
                    <td className="flex justify-center gap-2">
                      <button type="button" className="bg-slate-900/40 border border-slate-700 text-slate-100 rounded-lg px-3 py-2" onClick={() => toggleProvider(displayName)}>
                        {isExpanded ? "Ocultar" : "Ver productos"}
                      </button>
                      <button type="button" className="bg-slate-900/40 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 ml-2" onClick={() => handleAddItemClick(index)}>
                        + Producto
                      </button>
                    </td>
                  </tr>

                  {isExpanded && (
                    <tr className="provider-expansion-row">
                      <td colSpan={6}>
                        <div className="mt-3">
                          {row.relatedItems.length > 0 ? (
                            <table className="w-full min-w-[720px] border-separate border-spacing-0">
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
                                  <tr key={`${displayName}-${itemIndex}-${item.codigo || item.descripcion}`} className="odd:bg-slate-900/20">
                                    <td>{item.codigo || "-"}</td>
                                    <td>{item.descripcion || "-"}</td>
                                    <td>{formatPrice(item.precio)}</td>
                                    <td>
                                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${item.estado === 'vendido' ? 'bg-rose-800/40 text-rose-300 border border-rose-700' : 'bg-emerald-800/40 text-emerald-300 border border-emerald-700'}`}>{item.estado || '-'}</span>
                                    </td>
                                    <td>
                                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${(item.pago || '').toLowerCase() === 'pagado' ? 'bg-emerald-800/40 text-emerald-300 border border-emerald-700' : 'bg-amber-900/40 text-amber-200 border border-amber-700'}`}>{item.pago || 'no'}</span>
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
