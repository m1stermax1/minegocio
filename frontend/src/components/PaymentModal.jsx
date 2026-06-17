import { useState, useEffect } from "react";
import {
  sendWhatsAppMessage,
  createMercadoPagoTransfer,
  fetchPayments
} from "../services/api.js";

export default function PaymentModal({
  isOpen,
  onClose,
  payment = null,
  onPaymentUpdated,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  if (!isOpen || !payment) {
    return null;
  }

  useEffect(()=>{

  }, [])

 
  const proveedora = payment.proveedora;
  const itemsText = payment.items
    .map((item) => `${item.descripcion || item.nombre}`)
    .join("\n");
  const bulletList = itemsText
    .split("\n")
    .map((i) => `- ${i}`)
    .join("\n");
  const itemCount = payment.items.length;

  const messageText =
    itemCount === 1
      ? `Hola! <3
Se vendió esta prenda de la lista:
${bulletList}

De Viernes a Domingo hacemos transferencias!`
      : `Hola! <3
Se vendieron estas prendas de la lista:
${bulletList}

De Viernes a Domingo hacemos transferencias!`;

  const handleSendWhatsApp = async () => {
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (!proveedora?.telefono) {
        throw new Error("No hay número de teléfono para esta proveedora");
      }

      await sendWhatsAppMessage({
        phoneNumber: proveedora.telefono,
        message: messageText,
        items: payment.items,
      });

      setSuccess("Mensaje enviado por WhatsApp");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error enviando WhatsApp:", err);
      setError(err.message || "No se pudo enviar el mensaje");
    } finally {
      setLoading(false);
    }
  };

  const handleMercadoPagoTransfer = async () => {
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (!proveedora?.alias && !proveedora?.cbu) {
        throw new Error("No hay alias o CBU cargado para esta proveedora");
      }

      const transferData = {
        alias: proveedora.alias,
        cbu: proveedora.cbu,
        amount: payment.totalProvider,
        proveedora: proveedora.nombre,
      };

      const redirectUrl = await createMercadoPagoTransfer(transferData);

      if (redirectUrl) {
        window.open(redirectUrl, "_blank");
      }
    } catch (err) {
      console.error("Error con Mercado Pago:", err);
      setError(err.message || "No se pudo procesar la transferencia");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur flex items-center justify-center p-5 z-50">
      <div className="w-full max-w-lg bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden max-h-[90vh]">
        <div className="flex items-start justify-between gap-4 p-6 border-b border-slate-700">
          <div>
            <h2 className="text-xl font-semibold">
              Pago a {proveedora?.nombre}
            </h2>
            <p className="text-slate-400 text-sm m-0">
              {itemCount} producto{itemCount !== 1 ? "s" : ""} vendido
              {itemCount !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            type="button"
            className="text-slate-400 text-xl p-1 rounded-full hover:text-slate-100"
            onClick={onClose}
            aria-label="Cerrar modal"
            disabled={loading}
          >
            ✕
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {error && (
            <div className="text-rose-300 bg-rose-900/20 border border-rose-800 rounded-md p-3">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 bg-emerald-900/20 text-emerald-300 border border-emerald-800 rounded-md mb-4">
              {success}
            </div>
          )}

          <div className="mb-6">
            <h3 className="mb-3 text-base font-semibold">Productos vendidos</h3>
            <div className="max-h-[300px] overflow-y-auto">
              <table className="w-full min-w-[520px] border-separate border-spacing-0">
                <thead>
                  <tr>
                    <th>Descripción</th>
                    <th>Valor para proveedora</th>
                  </tr>
                </thead>
                <tbody>
                  {payment.items.map((item, index) => (
                    <tr key={index}>
                      <td>{item.descripcion || item.nombre || "-"}</td>
                      <td>
                        $
                        {Number(item.precioProveedora || 0).toLocaleString(
                          "es-AR",
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          },
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="mb-6 p-4 bg-slate-900/20 border border-slate-700 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm">Total a transferir</span>
              <strong className="text-lg text-accent">
                $
                {Number(payment.totalProvider || 0).toLocaleString("es-AR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </strong>
            </div>
          </div>

          <div className="mb-6 p-4 bg-slate-900/20 border border-slate-700 rounded-lg">
            <p className="mb-3 text-sm font-semibold text-accent">
              Mensaje que se enviará:
            </p>
            <p className="text-sm whitespace-pre-wrap text-slate-200">
              {messageText}
            </p>
          </div>

          <div className="flex flex-col gap-3 mb-6">
            <button
              type="button"
              className="flex items-center justify-center gap-2 bg-emerald-500 text-white rounded-lg px-4 py-2"
              onClick={handleSendWhatsApp}
              disabled={loading}
            >
              {loading ? "Enviando..." : "📱 Enviar por WhatsApp"}
            </button>

            <button
              type="button"
              className="flex items-center justify-center gap-2 bg-sky-600 text-white rounded-lg px-4 py-2"
              onClick={handleMercadoPagoTransfer}
              disabled={loading}
            >
              {loading ? "Procesando..." : "💳 Transferir en Mercado Pago"}
            </button>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              className="bg-slate-900/40 border border-slate-700 text-slate-100 rounded-lg px-3 py-2"
              onClick={onClose}
              disabled={loading}
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
