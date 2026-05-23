import { useState } from 'react';
import { addProvider } from '../services/api.js';

function ProvidersFormModal({ isOpen, onClose, onProviderAdded }) {
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [telefono, setTelefono] = useState('');
  const [notas, setNotas] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!nombre.trim() || !apellido.trim() || !telefono.trim()) {
      setError('Nombre, apellido y teléfono son obligatorios');
      return;
    }

    setLoading(true);
    try {
      await addProvider(nombre, apellido, telefono, notas);
      setNombre('');
      setApellido('');
      setTelefono('');
      setNotas('');
      if (onProviderAdded) {
        onProviderAdded();
      }
      onClose();
    } catch (err) {
      console.error('Error agregando proveedora:', err);
      setError(err.response?.data?.error || 'Error al agregar la proveedora');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal-header">
          <div>
            <h2>Nueva Proveedora</h2>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem', margin: 0 }}>
              Completa los datos de la proveedora
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
              <label>Nombre *</label>
              <input
                type="text"
                className="form-input"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: María"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label>Apellido *</label>
              <input
                type="text"
                className="form-input"
                value={apellido}
                onChange={(e) => setApellido(e.target.value)}
                placeholder="Ej: García"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label>Teléfono *</label>
              <input
                type="text"
                className="form-input"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="Ej: +54 9 11 1234-5678"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label>Notas (opcional)</label>
              <input
                type="text"
                className="form-input"
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Información adicional"
                disabled={loading}
              />
            </div>
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
              disabled={loading}
            >
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProvidersFormModal;
