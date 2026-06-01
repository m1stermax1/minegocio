import { Fragment, useState, useMemo } from "react";
import PaymentModal from "./PaymentModal.jsx";

import {
  updatePaymentStatus,
} from "../services/api.js";

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
    setExpandedProvider((prev) =>
      prev === proveedoraName ? null : proveedoraName,
    );
  };

  const paymentsByProvider = useMemo(() => {
    const groupedByProvider = {};

    payments.forEach((item) => {
      const provName = item.proveedora || "Sin proveedora";
      if (!groupedByProvider[provName]) {
        groupedByProvider[provName] = [];
      }
      groupedByProvider[provName].push(item);
    });

    return groupedByProvider;
  }, [payments]);

  const getProviderInfo = async (provName) => {
    try {
      const data = await fetchProvidersComplete();
      return data.find(
        (p) =>
          p.nombre?.toLowerCase() === provName?.toLowerCase() ||
          `${p.nombre || ""} ${p.apellido || ""}`
            .trim()
            .toLowerCase() === provName?.toLowerCase(),
      );
    } catch (err) {
      console.error("Error fetching complete providers:", err);
      return null;
    }
  };

  const calculateProviderTotal = (items) => {
    return items.reduce((sum, item) => {
      const precioSugerido = Number(item.precioSugerido || item.precio) || 0;
      const precioProveedora = precioSugerido * 0.6;
      return sum + precioProveedora;
    }, 0);
  };

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

        return `• ${item.descripcion || item.codigo || "Producto"} - $${precioProveedora.toLocaleString(
          "es-AR",
          {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          },
        )}`;
      })
      .join("\n");

    const totalProvider = calculateProviderTotal(items);

    const message = `Hola ${provName}, ¿cómo estás?

Te comparto el detalle de productos vendidos:

${productsText}

Total a pagar: $${totalProvider.toLocaleString("es-AR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}

Muchas gracias.`;

    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(
      message,
    )}`;

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
      <div className="table-state">No hay órdenes de pago en la hoja pagos maxi.</div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-separate border-spacing-3">
          <thead>
            <tr>
              <th className="text-center">Proveedora</th>
              <th className="text-center">Productos vendidos</th>
              <th className="text-center">Total a pagar</th>
              <th className="text-center">Estado</th>
              <th className="text-center">Acciones</th>
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

              const statusLabel = allPaid
                ? "Pagado"
                : anyContacted
                ? "Contactado"
                : "Pendiente";

              return (
                <Fragment key={`provider-${provName}`}>
                  <tr>
                    <td className="text-center">{provName}</td>
                    <td className="text-center">{items.length}</td>
                    <td className="text-center">
                      ${totalProvider.toLocaleString("es-AR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="text-center">
                      <span
                        className={`inline-flex justify-center items-center px-3 py-1 rounded-full text-sm font-semibold ${
                          allPaid
                            ? "bg-emerald-800/40 text-emerald-300 border border-emerald-700"
                            : anyContacted
                            ? "bg-blue-800/40 text-blue-200 border border-blue-700"
                            : "bg-amber-900/40 text-amber-200 border border-amber-700"
                        }`}
                      >
                        {statusLabel}
                      </span>
                    </td>
                    <td>
                      <div className="flex flex-wrap justify-center gap-2">
                        <button
                          type="button"
                          className="bg-slate-900/40 border border-slate-700 text-slate-100 rounded-lg px-3 py-2"
                          onClick={() => toggleExpanded(provName)}
                        >
                          {expandedProvider === provName ? "Ocultar" : "Ver detalles"}
                        </button>
                        <button
                          type="button"
                          className="bg-accent text-slate-900 font-semibold rounded-lg px-4 py-2"
                          onClick={() => handleContactToProvider(provName, items)}
                        >
                          Contactar
                        </button>
                        <button
                          type="button"
                          className="bg-slate-700 text-slate-100 rounded-lg px-4 py-2"
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
                        <div className="mt-3">
                          <table className="w-full min-w-[720px] border-separate border-spacing-0">
                            <thead>
                              <tr>
                                <th>Código</th>
                                <th>Descripción</th>
                                <th className="text-right">Valor para proveedora (60%)</th>
                                <th className="text-center">Estado</th>
                              </tr>
                            </thead>
                            <tbody>
                              {items.map((item, itemIndex) => {
                                const precioSugerido = Number(item.precioSugerido || item.precio) || 0;
                                const precioProveedora = precioSugerido * 0.6;

                                return (
                                  <tr
                                    key={`${provName}-${itemIndex}`}
                                    className="odd:bg-slate-900/20"
                                  >
                                    <td className="text-center">{item.codigo || "-"}</td>
                                    <td className="text-center">{item.descripcion || "-"}</td>
                                    <td className="text-right">
                                      ${precioProveedora.toLocaleString("es-AR", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      })}
                                    </td>
                                    <td className="text-center">
                                      {item.estado || "pendiente"}
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
