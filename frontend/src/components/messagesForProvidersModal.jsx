import { Fragment } from "react";

export default function MessageForProvidersModal({
  isOpen,
  onClose,
  listOfPendingPayments: pendingProviderPayments = [],
  sales = [],
  providers = [],
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-container modal-sm">
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Pagos Pendientes</h2>
            <p className="modal-subtitle">
              Lista de proveedores con pagos pendientes
            </p>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-icon"
            onClick={onClose}
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <div className="modal-body">
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="text-start">Nombre</th>
                  <th>Productos</th>
                  <th>Total</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {pendingProviderPayments.map((provider, index) => {
                  const providerItems = sales
                    .flatMap((sale) => sale.items)
                    .filter(
                      (item) =>
                        item.proveedora?.toLowerCase() === provider.nombre?.toLowerCase(),
                    );

                  const total = providerItems.reduce(
                    (acc, item) => acc + Number(item.precio || 0),
                    0,
                  );

                  return (
                    <Fragment key={`provider-${index}`}>
                      <tr>
                        <td className="text-start" style={{ fontSize: "0.875rem", fontWeight: 500 }}>
                          {provider.nombre}
                        </td>
                        <td style={{ fontSize: "0.875rem", fontWeight: 500 }}>
                          {providerItems.length}
                        </td>
                        <td style={{ fontSize: "0.875rem", fontWeight: 500 }}>
                          ${total.toLocaleString("es-AR")}
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => {
                              const providerData = providers.find(
                                (p) =>
                                  p.nombre?.toLowerCase() === provider.nombre?.toLowerCase(),
                              );
                              const phone = providerData?.telefono;

                              if (!phone) {
                                alert("La proveedora no tiene teléfono cargado.");
                                return;
                              }

                              const productsText = providerItems
                                .map(
                                  (item) =>
                                    `• ${item.descripcion} - $${Number(item.precio).toLocaleString("es-AR")}`,
                                )
                                .join("\n");

                              const message = `
Hola ${provider.nombre}, ¿cómo estás?

Te comparto el detalle de productos vendidos:

${productsText}

Total a pagar: $${total.toLocaleString("es-AR")}

Muchas gracias.
      `.trim();

                              const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
                              window.open(whatsappUrl, "_blank");
                            }}
                          >
                            Enviar WhatsApp
                          </button>
                        </td>
                      </tr>
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}