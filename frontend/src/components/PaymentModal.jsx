import { useState } from "react";
import {
  sendWhatsAppMessage,
  createMercadoPagoTransfer,
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

  if (!isOpen || !payment) return null;

  const proveedora = payment.proveedora;
  const bulletList = (payment.items || [])
    .map((item) => `- ${item.descripcion || item.nombre}`)
    .join("\n");
  const itemCount = payment.items?.length || 0;

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
      if (!proveedora?.telefono) throw new Error("No hay número de teléfono para esta proveedora");
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
      if (!proveedora?.alias && !proveedora?.cbu)
        throw new Error("No hay alias o CBU cargado para esta proveedora");

      const transferData = {
        alias: proveedora.alias,
        cbu: proveedora.cbu,
        amount: payment.totalProvider,
        proveedora: proveedora.nombre,
      };
      const redirectUrl = await createMercadoPagoTransfer(transferData);
      if (redirectUrl) window.open(redirectUrl, "_blank");
    } catch (err) {
      console.error("Error con Mercado Pago:", err);
      setError(err.message || "No se pudo procesar la transferencia");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-container modal-md">
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Pago a {proveedora?.nombre}</h2>
            <p className="modal-subtitle">
              {itemCount} producto{itemCount !== 1 ? "s" : ""} vendido{itemCount !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-icon"
            onClick={onClose}
            aria-label="Cerrar"
            disabled={loading}
          >
            ✕
          </button>
        </div>

        <div className="modal-body">
          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <div style={{ marginBottom: "1.5rem" }}>
            <h3 className="label">Productos vendidos</h3>
            <div style={{ maxHeight: 300, overflowY: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="text-start">Descripción</th>
                    <th>Valor para proveedora</th>
                  </tr>
                </thead>
                <tbody>
                  {payment.items.map((item, index) => (
                    <tr key={index}>
                      <td className="text-start">{item.descripcion || item.nombre || "-"}</td>
                      <td>
                        $
                        {Number(item.precioProveedora || 0).toLocaleString("es-AR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ marginBottom: "1.5rem", padding: "1rem", background: "var(--bg-surface-2)", borderRadius: "0.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.875rem" }}>Total a transferir</span>
              <strong style={{ fontSize: "1.125rem", color: "var(--primary)" }}>
                $
                {Number(payment.totalProvider || 0).toLocaleString("es-AR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </strong>
            </div>
          </div>

          <div style={{ marginBottom: "1.5rem", padding: "1rem", background: "var(--bg-surface-2)", borderRadius: "0.5rem" }}>
            <p className="label" style={{ color: "var(--primary)", marginBottom: "0.5rem" }}>
              Mensaje que se enviará:
            </p>
            <p style={{ fontSize: "0.875rem", whiteSpace: "pre-wrap", margin: 0 }}>
              {messageText}
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.5rem" }}>
            <button
              type="button"
              className="btn btn-primary btn-lg btn-block"
              onClick={handleSendWhatsApp}
              disabled={loading}
            >
              {loading ? "Enviando..." : "📱 Enviar por WhatsApp"}
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-lg btn-block"
              onClick={handleMercadoPagoTransfer}
              disabled={loading}
            >
              {loading ? "Procesando..." : "💳 Transferir en Mercado Pago"}
            </button>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}