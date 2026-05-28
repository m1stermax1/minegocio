import { Fragment, useState } from 'react';
import { addProvider } from '../services/api.js';

export default function MessageForProvidersModal({ isOpen, onClose, listOfPendingPayments: pendingProviderPayments = [], sales = [], providers = [] }) {

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 shadow-2xs backdrop-blur flex items-center justify-center p-5 z-50">
            <div className="pendingPaymentsProvidersModal w-full max-w-md bg-slate-800  border-2 border-[#bf99cc] border border-slate-700 rounded-2xl overflow-hidden">
                <div className="flex items-start justify-between gap-4 p-6 border-b border-slate-700">
                    <div>
                        <h2 className="text-xl font-semibold">Pagos Pendientes</h2>
                        <p className="text-slate-400 text-sm m-0">Lista de proveedores con pagos pendientes</p>
                    </div>
                    <button
                        type="button"
                        className="text-slate-400 text-xl p-1 rounded-full hover:text-slate-100"
                        onClick={onClose}
                        aria-label="Cerrar modal"
                    >
                        ✕
                    </button>
                </div>

                <table className="w-full border-separate border-spacing-0">
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Productos</th>
                            <th>Total</th>
                            <th>Accion</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pendingProviderPayments.map((provider, index) => {
                            console.log('provider', provider);
                            const providerItems = sales
                                .flatMap((sale) => sale.items)
                                .filter(
                                    (item) =>
                                        item.proveedora?.toLowerCase() ===
                                        provider.nombre?.toLowerCase()
                                );

                            return (
                                <Fragment key={`provider-${index}`}>
                                    <tr>
                                        <td className="text-sm font-medium">
                                            {provider.nombre}
                                        </td>

                                        <td className="text-sm font-medium">
                                            {providerItems.length}
                                        </td>

                                        <td className="text-sm font-medium">
                                            $
                                            {providerItems
                                                .reduce(
                                                    (acc, item) => acc + Number(item.precio || 0),
                                                    0
                                                )
                                                .toLocaleString("es-AR")}
                                        </td>


                                        <td className="text-sm font-medium">
                                            <button
                                                type="button"
                                                className="bg-green-600 hover:bg-green-700 transition-colors text-white px-3 py-1 rounded-lg text-sm"
                                                onClick={() => {
                                                    const providerData = providers.find(
                                                        (p) =>
                                                            p.nombre?.toLowerCase() ===
                                                            provider.nombre?.toLowerCase()
                                                    );

                                                    const phone = providerData?.telefono;

                                                    if (!phone) {
                                                        alert("La proveedora no tiene teléfono cargado.");
                                                        return;
                                                    }

                                                    const total = providerItems.reduce(
                                                        (acc, item) => acc + Number(item.precio || 0),
                                                        0
                                                    );

                                                    const productsText = providerItems
                                                        .map(
                                                            (item) =>
                                                                `• ${item.descripcion} - $${Number(
                                                                    item.precio
                                                                ).toLocaleString("es-AR")}`
                                                        )
                                                        .join("\n");

                                                    const message = `
Hola ${provider.nombre}, ¿cómo estás?

Te comparto el detalle de productos vendidos:

${productsText}

Total a pagar: $${total.toLocaleString("es-AR")}

Muchas gracias.
      `.trim();

                                                    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(
                                                        message
                                                    )}`;

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


    );
}

