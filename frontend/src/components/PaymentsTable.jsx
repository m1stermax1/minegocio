import { Fragment, useState, useMemo } from "react";
import PaymentModal from "./PaymentModal.jsx";

import { fetchProvidersComplete } from "../services/api.js";

export default function PaymentsTable({
  inventory = [],
  providers = [],
  loading,
}) {
  const [expandedProvider, setExpandedProvider] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const toggleExpanded = (proveedoraName) => {
    setExpandedProvider((prev) =>
      prev === proveedoraName ? null : proveedoraName,
    );
  };

  // Agrupar productos vendidos por proveedora
  const paymentsByProvider = useMemo(() => {
    const groupedByProvider = {};

    // Filtrar items vendidos que tienen proveedora
    const soldItems = inventory.filter(
      (item) =>
        (item.estado || "").toLowerCase() === "vendido" && item.proveedora,
    );

    // Agrupar por proveedora
    soldItems.forEach((item) => {
      const provName = item.proveedora;
      if (!groupedByProvider[provName]) {
        groupedByProvider[provName] = [];
      }
      groupedByProvider[provName].push(item);
    });

    return groupedByProvider;
  }, [inventory]);

  // Obtener información de proveedoras (teléfono, alias, CBU, etc.)
  const getProviderInfo = async (provName) => {
    try {
      const data = await fetchProvidersComplete();
      console.log("Proveedores completos:", data);
      return data.find(
        (p) =>
          p.nombre === provName ||
          `${p.nombre} ${p.apellido}`.trim() === provName,
      );
    } catch (err) {
      console.error("Error fetching complete providers:", err);
      return null;
    }
  };

  const calculateProviderTotal = (items) => {
    return items.reduce((sum, item) => {
      const precioSugerido = Number(item.precio) || 0;
      const precioProveedora = precioSugerido * 0.6; // 60% del precio sugerido
      return sum + precioProveedora;
    }, 0);
  };

  const handleOpenPaymentModal = async (provName, items) => {
    const providerInfo = await getProviderInfo(provName);

    console.log("Provider info resolved:", providerInfo);
    const totalProvider = calculateProviderTotal(items);

    const itemsWithProvider = items.map((item) => ({
      ...item,
      precioProveedora: (Number(item.precio) || 0) * 0.6,
    }));

    setSelectedPayment({
      proveedora: {
        nombre: provName,
        telefono: providerInfo?.telefono,
        alias: providerInfo?.alias,
        cbu: providerInfo?.cbu,
      },
      items: itemsWithProvider,
      totalProvider,
    });

    setShowPaymentModal(true);
  };

  if (loading) {
    return <div className="table-state">Cargando pagos...</div>;
  }

  const providerNames = Object.keys(paymentsByProvider);

  if (providerNames.length === 0) {
    return (
      <div className="table-state">No hay productos vendidos para pagar.</div>
    );
  }

  return (
    <>
      <div className="table-wrapper">
        <table className="inventory-table">
          <thead>
            <tr>
              <th>Proveedora</th>
              <th>Productos vendidos</th>
              <th>Total a pagar</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {providerNames.map((provName) => {
              const items = paymentsByProvider[provName];
              const totalProvider = calculateProviderTotal(items);
              const isPaid = items.every(
                (item) => (item.pagado || "").toLowerCase() === "si",
              );

              return (
                <Fragment key={`provider-${provName}`}>
                  <tr>
                    <td>{provName}</td>
                    <td>{items.length}</td>
                    <td>
                      $
                      {Number(totalProvider).toLocaleString("es-AR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td>
                      <span className={`payment-badge ${isPaid ? "paid" : "unpaid"}`}>
                        {isPaid ? "✓ Pagado" : "○ Pendiente"}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="secondary-btn"
                        onClick={() => toggleExpanded(provName)}
                      >
                        {expandedProvider === provName
                          ? "Ocultar"
                          : "Ver detalles"}
                      </button>
                    </td>
                  </tr>
                  {expandedProvider === provName && (
                    <tr>
                      <td colSpan={5}>
                        <div className="provider-items-table-wrapper">
                          <table className="inventory-table provider-items-table">
                            <thead>
                              <tr>
                                <th>Código</th>
                                <th>Descripción</th>
                                <th>Precio sugerido</th>
                                <th>Valor para proveedora (60%)</th>
                              </tr>
                            </thead>
                            <tbody>
                              {items.map((item, itemIndex) => {
                                const precioSugerido = Number(item.precio) || 0;
                                const precioProveedora = precioSugerido * 0.6;

                                return (
                                  <tr key={`${provName}-${itemIndex}`} className="provider-item-row">
                                    <td>{item.codigo || "-"}</td>
                                    <td>{item.descripcion || "-"}</td>
                                    <td>
                                      $
                                      {precioSugerido.toLocaleString("es-AR", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      })}
                                    </td>
                                    <td>
                                      $
                                      {precioProveedora.toLocaleString(
                                        "es-AR",
                                        {
                                          minimumFractionDigits: 2,
                                          maximumFractionDigits: 2,
                                        },
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>

                          <div
                            style={{
                              marginTop: "16px",
                              display: "flex",
                              gap: "12px",
                            }}
                          >
                            <button
                              type="button"
                              className="primary-btn"
                              onClick={() =>
                                handleOpenPaymentModal(provName, items)
                              }
                            >
                              Registrar pago
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setSelectedPayment(null);
        }}
        payment={selectedPayment}
        onPaymentUpdated={() => {
          setShowPaymentModal(false);
          setSelectedPayment(null);
        }}
      />
    </>
  );
}
