import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { FaCheck } from "react-icons/fa";
import {
  fetchProviders,
  addInventoryItem,
  sendWhatsAppMessage,
  printBarcode,
} from "../services/api.js";

const InventoryTable = forwardRef(function InventoryTable(
  { items, loading, onItemAdded, providers = [], showSelection = true },
  ref,
) {
  const [selectedItems, setSelectedItems] = useState([]);
  const [tableItems, setTableItems] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [pendingItems, setPendingItems] = useState([
    { nombre: "", precio: "", proveedora: "" },
  ]);
  const [providerDropdown, setProviderDropdown] = useState([]);
  const [generatedBarcodes, setGeneratedBarcodes] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingItemId, setPendingItemId] = useState(null);
  const [saleNotification, setSaleNotification] = useState("");
  const [providersComplete, setProvidersComplete] = useState([]);

  useEffect(() => {
    setProviderDropdown((prev) => {
      const next = pendingItems.map((_, i) => prev[i] || false);
      return next;
    });
  }, [pendingItems?.length]);

  useEffect(() => {
    setTableItems(items);
  }, [items]);

  useImperativeHandle(ref, () => ({
    openAddItemModal: () => {
      setFormError("");
      setPendingItems([{ nombre: "", precio: "", proveedora: "" }]);
      setGeneratedBarcodes([]);
      setShowModal(true);
    },
    getSelectedCount: () => selectedItems.length,
  }));

  if (loading) {
    return <div className="table-state">Cargando inventario...</div>;
  }

  const hasItems = tableItems?.length > 0;

  const formatInventoryPrice = (value) => {
    const amount = Number(value);
    return Number.isFinite(amount)
      ? `$ ${amount.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
      : "-";
  };

  const formatText = (value) => value?.toString().trim() || "-";

  const openModal = () => {
    setFormError("");
    setPendingItems([{ nombre: "", precio: "", proveedora: "" }]);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setFormError("");
  };

  const handleItemChange = (index, field, value) => {
    setPendingItems((prev) =>
      prev.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]: value,
            }
          : item,
      ),
    );
  };

  const addPendingItemRow = () => {
    const lastProveedora =
      pendingItems[pendingItems.length - 1]?.proveedora || "";
    setPendingItems((prev) => [
      ...prev,
      { nombre: "", precio: "", proveedora: lastProveedora },
    ]);
  };

  const removePendingItemRow = (index) => {
    setPendingItems((prev) =>
      prev.filter((_, itemIndex) => itemIndex !== index),
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");

    if (
      pendingItems.some(
        (item) =>
          !item.nombre.trim() ||
          !item.precio.toString().trim() ||
          !item.proveedora.trim(),
      )
    ) {
      setFormError("Completa todos los campos antes de agregar los items.");
      return;
    }

    const itemsToSend = pendingItems.map((item) => {
      const precioNumero = Number(item.precio.toString().replace(/,/g, "."));
      if (Number.isNaN(precioNumero)) {
        throw new Error("Precio inválido");
      }

      return {
        nombre: item.nombre.trim(),
        precio: precioNumero,
        proveedora: item.proveedora.trim(),
      };
    });

    setIsSaving(true);

    try {
      const result = await addInventoryItem(itemsToSend);
      const barcodes = result.barcodes || [];
      setGeneratedBarcodes(barcodes);
      // Send WhatsApp message with generated barcodes
      try {
        await sendWhatsAppMessage({ barcodes });
      } catch (whError) {
        console.error("Error sending WhatsApp message:", whError);
      }
      closeModal();
      onItemAdded?.();
    } catch (error) {
      console.error("Error agregando item en Sheets:", error);
      setFormError(
        error?.message?.includes("Precio inválido")
          ? "Al menos un precio es inválido."
          : "No se pudo agregar el item. Intenta de nuevo.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleBarcodeImpresion = async (barcode) => {
    await printBarcode(barcode);
  };

  return (
    <div className="overflow-x-auto">
      {saleNotification && (
        <div className="toast-notification">{saleNotification}</div>
      )}

      {!hasItems ? (
        <div className="text-slate-400 p-10 text-center bg-slate-900/40 rounded-lg">
          No se encontraron productos.
        </div>
      ) : (
        <>
          {generatedBarcodes.length > 0 && (
            <div className="barcode-result">
              <p className="barcode-result-title">Códigos de barra generados</p>
              <ul className="barcode-list">
                {generatedBarcodes.map((barcode) => (
                  <li key={barcode.codigo}>
                    <strong>{barcode.codigo}</strong> —
                    <a href={barcode.url} target="_blank" rel="noreferrer">
                      Descargar SVG
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <table className="modern-table w-full border-separate border-spacing-3">
            <thead>
              <tr>
                <th className="text-start">Nombre</th>
                <th className="text-center">Precio</th>
                <th className="text-center">Proveedor</th>
                <th className="text-center">Estado</th>
                <th className="text-center">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {tableItems.map((item, index) => (
                <tr key={`${item.id}-${index}`}>
                  <td className="text-start">{formatText(item.description)}</td>

                  <td className="text-center">
                    {formatInventoryPrice(item.price)}
                  </td>

                  <td className="text-center">
                    {formatText(item.providerName)}
                  </td>

                  <td className="text-center">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${item.status?.toLowerCase() === "sold" ? "bg-pink-500 text-rose-300 border border-rose-700" : "bg-emerald-800/40 text-emerald-300 border border-emerald-700"}`}
                    >
                      {item.status == "AVAILABLE" ? "En Stock" : "Vendido"}
                    </span>
                  </td>

                  <td className="text-center">
                    <button onClick={handleBarcodeImpresion(item.barcode)}>
                      Imprimir Etiqueta
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
});

export default InventoryTable;
