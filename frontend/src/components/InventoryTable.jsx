import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { FaCheck } from "react-icons/fa";
import { fetchProviders, updateInventoryRowStatus, addInventoryItem, fetchProvidersComplete } from "../services/api.js";

const InventoryTable = forwardRef(function InventoryTable({ items, loading, onItemAdded, providers = [], showSelection = true }, ref) {
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

  // Cargar proveedoras de "proveedoras maxi"
  useEffect(() => {
    const loadProviders = async () => {
      try {
        const data = await fetchProvidersComplete();
        setProvidersComplete(data || []);
      } catch (err) {
        console.error('Error cargando proveedoras:', err);
      }
    };
    loadProviders();
  }, []);


  useEffect(() => {
    setProviderDropdown((prev) => {
      const next = pendingItems.map((_, i) => prev[i] || false);
      return next;
    });
  }, [pendingItems.length]);

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
    return (
      <div className="table-state">
        Cargando inventario...
      </div>
    );
  }

  const hasItems = tableItems.length > 0;

  const toggleSelect = (itemId) => {
    setSelectedItems((prev) => {
      if (prev.includes(itemId)) {
        return prev.filter((id) => id !== itemId);
      }

      return [...prev, itemId];
    });
  };

  const isSelected = (itemId) => {
    return selectedItems.includes(itemId);
  };

  const toggleStatus = async (itemId) => {
    const currentItem = tableItems.find((item) => item.id === itemId);
    if (!currentItem) return;

    const nextState =
      currentItem.estado?.toLowerCase() === "vendido"
        ? "en stock"
        : "vendido";

    // If changing to "vendido", open payment modal
    if (nextState === "vendido") {
      setPendingItemId(itemId);
      setShowPaymentModal(true);
    } else {
      // If changing to "en stock", just update without modal
      setTableItems((prevItems) =>
        prevItems.map((item) => {
          if (item.id === itemId) {
            return {
              ...item,
              estado: nextState,
            };
          }
          return item;
        }),
      );

      try {
        await updateInventoryRowStatus(itemId, nextState);
      } catch (error) {
        console.error('Error actualizando estado en Sheets:', error);
      }
    }
  };

  const handlePaymentConfirm = async (metodoPago) => {
    if (!pendingItemId) return;

    // Get the current item to access its price
    const currentItem = tableItems.find((item) => item.id === pendingItemId);
    if (!currentItem) return;

    // Calculate discount based on payment method
    let discountedPrice = currentItem.precio;
    if (metodoPago === 'efectivo') {
      discountedPrice = currentItem.precio * 0.90; // 10% discount
    } else if (metodoPago === 'transferencia') {
      discountedPrice = currentItem.precio * 0.95; // 5% discount
    } else if (metodoPago === 'debito/credito') {
      discountedPrice = currentItem.precio * 0.9441; // 5.59% discount
    }

    setTableItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id === pendingItemId) {
          return {
            ...item,
            estado: "vendido",
          };
        }
        return item;
      }),
    );

    try {
      await updateInventoryRowStatus(
        pendingItemId,
        "vendido",
        metodoPago,
        discountedPrice
      );
      
      setShowPaymentModal(false);
      setSaleNotification("Venta cargada correctamente");
      setTimeout(() => setSaleNotification(""), 3200);
    } catch (error) {
      console.error('Error actualizando estado en Sheets:', error);
      setSaleNotification("Error al cargar la venta");
      setTimeout(() => setSaleNotification(""), 3200);
    } finally {
      setPendingItemId(null);
    }
  };


  const formatInventoryPrice = (value) => {
    const amount = Number(value);
    return Number.isFinite(amount)
      ? `$ ${amount.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
      : '-';
  };

  const formatText = (value) => value?.toString().trim() || '-';

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
    const lastProveedora = pendingItems[pendingItems.length - 1]?.proveedora || "";
    setPendingItems((prev) => [
      ...prev,
      { nombre: "", precio: "", proveedora: lastProveedora },
    ]);
  };

  const removePendingItemRow = (index) => {
    setPendingItems((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
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
      const precioNumero = Number(item.precio.toString().replace(/,/g, '.'));
      if (Number.isNaN(precioNumero)) {
        throw new Error('Precio inválido');
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
      setGeneratedBarcodes(result.barcodes || []);
      closeModal();
      onItemAdded?.();
    } catch (error) {
      console.error('Error agregando item en Sheets:', error);
      setFormError(
        error?.message?.includes('Precio inválido')
          ? 'Al menos un precio es inválido.'
          : 'No se pudo agregar el item. Intenta de nuevo.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const openProviderDropdown = (index) => {
    setProviderDropdown((prev) => prev.map((v, i) => (i === index ? true : v)));
  };

  const closeProviderDropdown = (index) => {
    setTimeout(() => {
      setProviderDropdown((prev) => prev.map((v, i) => (i === index ? false : v)));
    }, 150);
  };

  const selectProvider = (index, nombre) => {
    
    handleItemChange(index, 'proveedora', nombre);
    setProviderDropdown((prev) => prev.map((v, i) => (i === index ? false : v)));
  };

  return (
    <div className="table-wrapper">

      {saleNotification && (
        <div className="toast-notification">{saleNotification}</div>
      )}

      {!hasItems ? (
        <div className="table-state">
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

          <table className="inventory-table">
          <thead>
          <tr>
            {showSelection && <th>Acción</th>}
            <th>Descripción</th>
            <th>Precio</th>
            <th>Proveedor</th>
            <th>Estado</th>
          </tr>
        </thead>

        <tbody>
          {tableItems.map((item, index) => (
            <tr
              key={`${item.codigo}-${index}`}
              className={
                isSelected(item.id)
                  ? "selected-row"
                  : ""
              }
            >

              {showSelection && (
                <td>
                  <button
                    className={`check-btn ${
                      isSelected(item.id)
                        ? "active"
                        : ""
                    }`}
                    onClick={() =>
                      toggleSelect(item.id)
                    }
                  >
                    <FaCheck />
                  </button>
                </td>
              )}

              <td>{formatText(item.descripcion)}</td>

              <td>{formatInventoryPrice(item.precio)}</td>

              <td>{formatText(item.proveedora)}</td>

              {/* STATUS */}
              <td>
                <button
                  onClick={() =>
                    toggleStatus(item.id)
                  }
                  className={`status-badge ${
                    item.estado?.toLowerCase()
                  }`}
                >
                  {item.estado}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
        </>
      )}

      {showModal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal">
            <div className="modal-header">
              <div>
                <p className="eyebrow">Nuevo item</p>
                <h2>Agregar inventario</h2>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={closeModal}
                aria-label="Cerrar modal"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              {pendingItems.map((item, index) => (
                <div key={index} className="form-row">
                  <div className="form-row-header">
                    <strong>Item {index + 1}</strong>
                    <button
                      type="button"
                      className="remove-row-btn"
                      onClick={() => removePendingItemRow(index)}
                      disabled={pendingItems.length === 1}
                    >
                      ✕ Eliminar
                    </button>
                  </div>

                  <div className="form-row-fields">
                      <div className="form-group">
                      <label htmlFor={`nombre-${index}`}>Nombre del producto</label>
                      <input
                        id={`nombre-${index}`}
                        className="form-input"
                        type="text"
                        value={item.nombre}
                        onChange={(event) => handleItemChange(index, 'nombre', event.target.value)}
                        placeholder="Ej. Tornillo 3/8"
                        autoComplete="off"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor={`precio-${index}`}>Precio</label>
                      <input
                        id={`precio-${index}`}
                        className="form-input"
                        type="text"
                        value={item.precio}
                        onChange={(event) => handleItemChange(index, 'precio', event.target.value)}
                        placeholder="Ej. 2300"
                        autoComplete="off"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor={`proveedora-${index}`}>Proveedora</label>
                      <div className="provider-combobox">
                        <input
                          id={`proveedora-${index}`}
                          className="form-input provider-input"
                          type="text"
                          value={item.proveedora}
                          onChange={(event) => handleItemChange(index, 'proveedora', event.target.value)}
                          onFocus={() => openProviderDropdown(index)}
                          placeholder="Selecciona o escribe una proveedora"
                          autoComplete="off"
                        />
                        <button
                          type="button"
                          className="clear-provider-btn"
                          onClick={() => handleItemChange(index, 'proveedora', '')}
                          aria-label="Limpiar proveedora"
                        >
                          ×
                        </button>

                        {providerDropdown[index] && (
                          <ul className="providers-dropdown" role="listbox">
                            {providersComplete
                              .filter((p) => {
                                const fullName = `${p.nombre} ${p.apellido}`.toLowerCase();
                                const searchTerm = (item.proveedora || '').toLowerCase();
                                return fullName.includes(searchTerm);
                              })
                              .map((provider, idx) => (
                                <li
                                  key={idx}
                                  role="option"
                                  tabIndex={0}
                                  className="provider-option"
                                  onMouseDown={() => selectProvider(index, `${provider.nombre} ${provider.apellido}`)}
                                >
                                  {provider.nombre} {provider.apellido}
                                </li>
                              ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {formError && <p className="form-error">{formError}</p>}

              <button
                type="button"
                className="add-row-btn"
                onClick={addPendingItemRow}
              >
                + Agregar otro item
              </button>

              <div className="modal-footer">
                <button type="button" className="secondary-btn" onClick={closeModal}>
                  Cancelar
                </button>
                <button type="submit" className="primary-btn" disabled={isSaving}>
                  {isSaving
                    ? 'Agregando...'
                    : `Agregar ${pendingItems.length} item${pendingItems.length > 1 ? 's' : ''}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPaymentModal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal payment-modal">
            <div className="modal-header">
              <div>
                <p className="eyebrow">Vender producto</p>
                <h2>Selecciona método de pago</h2>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setShowPaymentModal(false)}
                aria-label="Cerrar modal"
              >
                ×
              </button>
            </div>

            <div className="modal-content payment-content">
              <div className="payment-methods">
                <button
                  type="button"
                  className="payment-method-btn"
                  onClick={() => handlePaymentConfirm('efectivo')}
                >
                  Efectivo
                </button>
                <button
                  type="button"
                  className="payment-method-btn"
                  onClick={() => handlePaymentConfirm('transferencia')}
                >
                  Transferencia
                </button>
                <button
                  type="button"
                  className="payment-method-btn"
                  onClick={() => handlePaymentConfirm('debito/credito')}
                >
                  Débito/Crédito
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
});

export default InventoryTable;