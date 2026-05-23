import { useState, useEffect } from 'react';
import { addInventoryItem, fetchProvidersComplete } from '../services/api.js';

function ItemsFormModal({ isOpen, onClose, onItemsAdded, defaultProviderId }) {
  const [providers, setProviders] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [items, setItems] = useState([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Cargar proveedoras
  useEffect(() => {
    if (isOpen) {
      loadProviders();
    }
  }, [isOpen]);

  const loadProviders = async () => {
    try {
      const data = await fetchProvidersComplete();
      setProviders(data || []);
      if (defaultProviderId !== undefined && data[defaultProviderId]) {
        setSelectedProvider(data[defaultProviderId]);
      }
    } catch (err) {
      console.error('Error cargando proveedoras:', err);
    }
  };

  const handleAddItem = () => {
    if (!newItemName.trim() || !newItemPrice.trim()) {
      setError('Nombre y precio son obligatorios');
      return;
    }

    const priceNum = parseFloat(newItemPrice.replace(/,/g, '.'));
    if (isNaN(priceNum)) {
      setError('Precio inválido');
      return;
    }

    setItems([
      ...items,
      {
        id: Date.now(),
        nombre: newItemName,
        precio: priceNum,
      },
    ]);

    setNewItemName('');
    setNewItemPrice('');
    setError('');
  };

  const handleRemoveItem = (id) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const generateWhatsAppMessage = () => {
    if (!items.length || !selectedProvider) return '';

    let message = `Hola ${selectedProvider.nombre}, aquí te envío los detalles de los productos:\n\n`;

    const total = items.reduce((sum, item) => sum + item.precio, 0);

    items.forEach((item) => {
      message += `*${item.nombre}* - $${item.precio.toLocaleString('es-AR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      })}\n`;
    });

    message += `\n*Total: $${total.toLocaleString('es-AR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}*`;

    return message;
  };

  const generateWhatsAppLink = () => {
    const message = generateWhatsAppMessage();
    const encodedMessage = encodeURIComponent(message);
    const phone = selectedProvider.telefono.replace(/\D/g, '');
    return `https://wa.me/${phone}?text=${encodedMessage}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!selectedProvider) {
      setError('Selecciona una proveedora');
      return;
    }

    if (!items.length) {
      setError('Agrega al menos un item');
      return;
    }

    setLoading(true);
    try {
      // Agregar los items
      const itemsToAdd = items.map((item) => ({
        nombre: item.nombre,
        precio: item.precio.toString(),
        proveedora: selectedProvider.nombre,
      }));

      await addInventoryItem(itemsToAdd);

      // Limpiar formulario
      setItems([]);
      setNewItemName('');
      setNewItemPrice('');
      setSelectedProvider(null);

      if (onItemsAdded) {
        onItemsAdded();
      }

      // Redirigir a WhatsApp
      const whatsappLink = generateWhatsAppLink();
      window.open(whatsappLink, '_blank');

      onClose();
    } catch (err) {
      console.error('Error agregando items:', err);
      setError(err.response?.data?.error || 'Error al agregar los items');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const total = items.reduce((sum, item) => sum + item.precio, 0);

  return (
    <div className="modal-backdrop">
      <div className="modal" style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <div>
            <h2>Agregar Productos</h2>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem', margin: 0 }}>
              Agrega productos y envíalos por WhatsApp
            </p>
          </div>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Cerrar modal"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-form">
            {error && <div className="form-error">{error}</div>}

            <div className="form-group">
              <label>Proveedora *</label>
              <select
                className="form-select"
                value={selectedProvider?.id || ''}
                onChange={(e) => {
                  const id = parseInt(e.target.value);
                  setSelectedProvider(providers[id] || null);
                }}
                disabled={loading}
              >
                <option value="">Selecciona una proveedora</option>
                {providers.map((prov, idx) => (
                  <option key={idx} value={idx}>
                    {prov.nombre} {prov.apellido}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ borderTop: '1px solid var(--border)', margin: '16px 0', paddingTop: '16px' }}>
              <h3 style={{ fontSize: '0.95rem', marginBottom: '12px' }}>Agregar Producto</h3>

              <div style={{ display: 'grid', gap: '12px', marginBottom: '12px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Nombre del Producto</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder="Ej: Remera azul"
                    disabled={loading}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label>Precio</label>
                  <input
                    type="number"
                    className="form-input"
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(e.target.value)}
                    placeholder="Ej: 1500"
                    step="0.01"
                    disabled={loading}
                  />
                </div>

                <button
                  type="button"
                  className="primary-btn"
                  onClick={handleAddItem}
                  disabled={loading}
                  style={{ width: '100%' }}
                >
                  Agregar Producto
                </button>
              </div>
            </div>

            {items.length > 0 && (
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                <h3 style={{ fontSize: '0.95rem', marginBottom: '12px' }}>Productos ({items.length})</h3>
                <div style={{ display: 'grid', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                  {items.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px',
                        background: 'rgba(56, 189, 248, 0.08)',
                        borderRadius: '8px',
                      }}
                    >
                      <div>
                        <p style={{ margin: 0, fontWeight: 600 }}>{item.nombre}</p>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--muted)' }}>
                          ${item.precio.toLocaleString('es-AR')}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="remove-row-btn"
                        onClick={() => handleRemoveItem(item.id)}
                        disabled={loading}
                      >
                        Eliminar
                      </button>
                    </div>
                  ))}
                </div>

                <div
                  style={{
                    marginTop: '12px',
                    padding: '10px',
                    background: 'rgba(34, 197, 94, 0.1)',
                    borderRadius: '8px',
                    borderLeft: '3px solid var(--success)',
                  }}
                >
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--muted)' }}>Total</p>
                  <p style={{ margin: 0, fontSize: '1.3rem', fontWeight: 700 }}>
                    ${total.toLocaleString('es-AR')}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="secondary-btn"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="primary-btn"
              disabled={loading || !items.length || !selectedProvider}
            >
              {loading ? 'Enviando...' : '✓ Guardar y Enviar por WhatsApp'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ItemsFormModal;
