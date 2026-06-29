import { Fragment, useState, useMemo } from "react";
import PaymentModal from "./PaymentModal.jsx";
import { updatePaymentStatus, fetchProviders } from "../services/api.js";

export default function PaymentsTable({
  payments = [],
  providers = [],
  loading,
  onPaymentsUpdated,
}) {
  const [expandedProvider, setExpandedProvider] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const toggleExpanded = (proveedoraName) => {
    setExpandedProvider((prev) => (prev === proveedoraName ? null : proveedoraName));
  };

  const paymentsByProvider = useMemo(() => {
    const groupedByProvider = {};
    payments.forEach((item) => {
      const provName = item.provider_id || "Sin proveedora";
      if (!groupedByProvider[provName]) groupedByProvider[provName] = [];
      groupedByProvider[provName].push(item);
    });
    return groupedByProvider;
  }, [payments]);

  const calculateProviderTotal = (items) =>
    items.reduce((sum, item) => sum + (Number(item.total_amount) || 0), 0);

  const handleContactToProvider = async (provName, items) => {
    const providerData = providers.find(
      (p) => p.nombre?.toLowerCase() === provName?.toLowerCase(),
    );
    const phone = providerData?.telefono;

    if (!phone) {
      alert("La proveedora no tiene teléfono cargado.");
      return;
    }

    const productsText = items
      .map((item) => {
        const precioOriginal = Number(item.precioSugerido || item.precio) || 0;
        const precioProveedora = precioOriginal * 0.6;
        return `• ${item.descripcion || item.codigo || "Producto"} - $${precioProveedora.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      })
      .join("\n");

    const totalProvider = calculateProviderTotal(items);

    const message = `Hola ${provName}, ¿cómo estás?

Te comparto el detalle de productos vendidos:

${productsText}

Total a pagar: $${totalProvider.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}

Muchas gracias.`;

    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");

    try {
      const codigos = items.map((item) => item.codigo).filter(Boolean);
      if (codigos.length > 0) {
        await updatePaymentStatus(codigos, "contactado");
        onPaymentsUpdated?.();
      }
    } catch (err) {
      console.error("Error actualizando estado de pago:", err);
    }
  };

  if (loading) {
    return <div className="table-state">Cargando pagos...</div>;
  }

  const providerNames = Object.keys(paymentsByProvider);

  if (providerNames.length === 0) {
    return (
      <div className="empty-state">
        No hay órdenes de pago en la hoja pagos maxi.
      </div>
    );
  }

  return (
    <>
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Proveedora</th>
              <th>Productos vendidos</th>
              <th>Total a pagar</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {providerNames.map((provName) => {
              const items = paymentsByProvider[provName];
              const totalProvider = calculateProviderTotal(items);
              const allPaid = items.every(
                (item) => (item.estado || "").toLowerCase() === "pagado",
              );
              const anyContacted = items.some(
                (item) => (item.estado || "").toLowerCase() === "contactado",
              );

              const statusLabel = allPaid ? "Pagado" : anyContacted ? "Contactado" : "Pendiente";
              const statusClass = allPaid
                ? "badge-success"
                : anyContacted
                  ? "badge-info"
                  : "badge-warning";

              return (
                <Fragment key={`provider-${provName}`}>
                  <tr>
                    <td>{provName}</td>
                    <td>{items.length}</td>
                    <td>
                      $
                      {totalProvider.toLocaleString("es-AR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td>
                      <span className={`badge ${statusClass}`}>{statusLabel}</span>
                    </td>
                    <td>
                      <div className="flex flex-wrap justify-center gap-2">
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => toggleExpanded(provName)}
                        >
                          {expandedProvider === provName ? "Ocultar" : "Ver detalles"}
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => handleContactToProvider(provName, items)}
                        >
                          Contactar
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => alert("Transferir aún no está disponible.")}
                        >
                          Transferir
                        </button>
                      </div>
                    </td>
                  </tr>

                  {expandedProvider === provName && (
                    <tr>
                      <td colSpan={5}>
                        <div style={{ padding: "0.75rem 0" }}>
                          <table className="data-table">
                            <thead>
                              <tr>
                                <th>Código</th>
                                <th>Descripción</th>
                                <th className="text-end">Valor para proveedora (60%)</th>
                                <th>Estado</th>
                              </tr>
                            </thead>
                            <tbody>
                              {items.map((item, itemIndex) => {
                                const precioProveedora = Number(item.total_amount) || 0;
                                return (
                                  <tr key={`${provName}-${itemIndex}`}>
                                    <td>{item.barcode || "-"}</td>
                                    <td>{item.description || "-"}</td>
                                    <td className="text-end">
                                      $
                                      {precioProveedora.toLocaleString("es-AR", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      })}
                                    </td>
                                    <td>{item.estado || "pendiente"}</td>
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