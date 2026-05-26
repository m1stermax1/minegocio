import { useState } from "react";
import { sendWhatsAppMessage, createMercadoPagoTransfer } from "../services/api.js";

export default function PaymentModal({ isOpen, onClose, payment = null, onPaymentUpdated }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  if (!isOpen || !payment) {
    return null;
  }

  const proveedora = payment.proveedora;
  const itemsText = payment.items.map((item) => `${item.descripcion || item.nombre}`).join("\n");
  const bulletList = itemsText.split('\n').map(i => `- ${i}`).join('\n');
  const itemCount = payment.items.length;

  const messageText = itemCount === 1
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
    <div className="modal-backdrop">
      <div className="modal" style={{ maxWidth: "600px", width: "100%", maxHeight: "90vh", overflowY: "auto" }}>
        <div className="modal-header">
          <div>
            <h2>Pago a {proveedora?.nombre}</h2>
            <p style={{ color: "var(--muted)", fontSize: "0.9rem", margin: 0 }}>
              {itemCount} producto{itemCount !== 1 ? "s" : ""} vendido{itemCount !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Cerrar modal"
            disabled={loading}
          >
            ✕
          </button>
        </div>

        <div className="modal-form">
          {error && <div className="form-error">{error}</div>}
          {success && (
            <div
              className="form-success"
              style={{
                padding: "12px 14px",
                backgroundColor: "rgba(34, 197, 94, 0.14)",
                color: "var(--success)",
                border: "1px solid var(--success)",
                borderRadius: "12px",
                marginBottom: "16px",
              }}
            >
              {success}
            </div>
          )}

          <div style={{ marginBottom: "24px" }}>
            <h3 style={{ margin: "0 0 12px" }}>Productos vendidos</h3>
            <div className="table-wrapper" style={{ maxHeight: "300px", overflowY: "auto" }}>
              <table className="inventory-table">
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
                        ${Number(item.precioProveedora || 0).toLocaleString("es-AR", {
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

          <div className="summary-card" style={{ marginBottom: "24px" }}>
            <div className="summary-row">
              <span>Total a transferir</span>
              <strong style={{ fontSize: "1.2rem", color: "var(--accent)" }}>
                ${Number(payment.totalProvider || 0).toLocaleString("es-AR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </strong>
            </div>
          </div>

          <div
            style={{
              marginBottom: "24px",
              padding: "16px",
              backgroundColor: "var(--surface-strong)",
              border: "1px solid var(--border)",
              borderRadius: "12px",
            }}
          >
            <p style={{ margin: "0 0 12px", fontSize: "0.9rem", fontWeight: 600, color: "var(--accent)" }}>
              Mensaje que se enviará:
            </p>
            <p style={{ margin: 0, fontSize: "0.9rem", lineHeight: "1.5", whiteSpace: "pre-wrap", color: "var(--text)" }}>
              {messageText}
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px" }}>
            <button
              type="button"
              className="primary-btn"
              onClick={handleSendWhatsApp}
              disabled={loading}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                backgroundColor: "#25D366",
                color: "#ffffff",
                transition: "background-color 0.2s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#20ba5a")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#25D366")}
            >
              {loading ? "Enviando..." : "📱 Enviar por WhatsApp"}
            </button>

            <button
              type="button"
              className="primary-btn"
              onClick={handleMercadoPagoTransfer}
              disabled={loading}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                backgroundColor: "#009EE3",
                color: "#ffffff",
                transition: "background-color 0.2s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#008ac6")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#009EE3")}
            >
              {loading ? "Procesando..." : "💳 Transferir en Mercado Pago"}
            </button>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
            <button
              type="button"
              className="secondary-btn"
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
