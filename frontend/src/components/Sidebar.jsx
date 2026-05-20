import { AiOutlineAppstore } from 'react-icons/ai';
import { FiBox, FiTrendingUp, FiCreditCard } from 'react-icons/fi';

function Sidebar({ activeView, onViewChange }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <AiOutlineAppstore className="brand-icon" />
        <div>
          <span className="brand-label">Mi Negocio App</span>
        </div>
      </div>

      <nav className="menu">
        <button
          className={`menu-item ${activeView === 'inventory' ? 'active' : ''}`}
          type="button"
          onClick={() => onViewChange('inventory')}
        >
          <FiBox className="menu-icon" />
          <span>Inventario</span>
        </button>
        <button
          className={`menu-item ${activeView === 'providers' ? 'active' : ''}`}
          type="button"
          onClick={() => onViewChange('providers')}
        >
          <FiBox className="menu-icon" />
          <span>Proveedoras</span>
        </button>
        <button
          className={`menu-item ${activeView === 'ventas' ? 'active' : ''}`}
          type="button"
          onClick={() => onViewChange('ventas')}
        >
          <FiTrendingUp className="menu-icon" />
          <span>Ventas</span>
        </button>
        <button
          className={`menu-item ${activeView === 'pagos' ? 'active' : ''}`}
          type="button"
          onClick={() => onViewChange('pagos')}
        >
          <FiCreditCard className="menu-icon" />
          <span>Pagos</span>
        </button>
      </nav>
    </aside>
  );
}

export default Sidebar;
