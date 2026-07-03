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

  // Create a map from provider id to provider object for quick lookup
  const providerById = useMemo(() => {
    const map = {};
    providers?.data?.forEach(p => {
      map[p.id] = p;
    });
    return map;
  }, [providers]);

  // Create a map from provider id to formatted name (first + last) for display
  const providerNameById = useMemo(() => {
    const map = {};
    providers?.data?.forEach(p => {
      const name = `${p.first_name || ''} ${p.last_name || ''}`.trim();
      map[p.id] = name || 'Sin nombre';
    });
    return map;
  }, [providers]);

  // Group payments by provider id
  const paymentsByProvider = useMemo(() => {
    const groupedByProvider = {};
    payments.forEach((item) => {
      const provId = item.provider_id;
      if (!groupedByProvider[provId]) groupedByProvider[provId] = [];
      groupedByProvider[provId].push(item);
    });
    return groupedByProvider;
  }, [payments]);

  const calculateProviderTotal = (items) =>
    items.reduce((sum, item) => sum + (Number(item.total_amount) || 0), 0);

  const handleContactToProvider = async (providerId, items) => {
    const providerData = providerById[providerId];
    const phone = providerData?.telefono || "+5491160332587";

    const productsText = items
      .map((item) => {
        const description = item.descripcion || item.description || item.codigo || item.barcode || "Producto";
        const providerAmount = Number(item.total_amount) || Number(item.precioSugerido) * 0.6 || Number(item.precio) * 0.6 || 0;
        return `• ${description} - $${providerAmount.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      })
      .join("\n");

    const totalProvider = items.reduce(
      (sum, item) => sum + (Number(item.total_amount) || Number(item.precioSugerido) * 0.6 || Number(item.precio) * 0.6 || 0),
      0,
    );

    const provName = providerNameById[providerId] || "Sin proveedora";

    const message = `Hola ${provName}, ¿cómo estás?\n\nTe comparto el detalle de productos vendidos:\n\n${productsText}\n\nTotal de todos los productos vendidos: $${totalProvider.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n\nMuchas gracias.`;

    const formattedPhone = phone.toString().replace(/\D/g, "");
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");

    try {
      const codigos = items.map((item) => item.codigo || item.barcode).filter(Boolean);
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

  const providerIds = Object.keys(paymentsByProvider);

  if (providerIds.length === 0) {
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
            {providerIds.map((providerId) => {
              const items = paymentsByProvider[providerId];
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

              const provName = providerNameById[providerId] || 'Sin proveedora';

              return (
                <Fragment key={`provider-${providerId}`}>
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
                          onClick={() =>
                            setExpandedProvider((prev) =>
                              prev === providerId ? null : providerId,
                            )
                          }
                        >
                          {expandedProvider === providerId ? "Ocultar" : "Ver detalles"}
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => handleContactToProvider(providerId, items)}
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

                  {expandedProvider === providerId && (
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
                                  <tr key={`${providerId}-${itemIndex}`}>
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