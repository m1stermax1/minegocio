import { AiOutlineAppstore, AiOutlineDashboard } from 'react-icons/ai';
import { FiBox, FiTrendingUp, FiCreditCard } from 'react-icons/fi';

function Sidebar({ activeView, onViewChange }) {
  return (
    <aside className="bg-slate-800 p-8 flex flex-col gap-8">
      <div className="flex items-center gap-4">
        <AiOutlineAppstore className="w-10 h-10 text-accent" />
        <div>
          <span className="text-lg font-semibold">Lila Feria Americana</span>
        </div>
      </div>

      <nav className="sidebar flex flex-col gap-2">
        <button
          className={`flex items-center gap-3 px-4 py-3 rounded-xl text-slate-100 transition ${activeView === 'dashboard' ? 'bg-slate-700' : 'hover:bg-slate-700'}`}
          type="button"
          onClick={() => onViewChange('dashboard')}
        >
          <AiOutlineDashboard className="w-5 h-5" />
          <span>Dashboard</span>
        </button>
        <button
          className={`flex items-center gap-3 px-4 py-3 rounded-xl text-slate-100 transition ${activeView === 'inventory' ? 'bg-slate-700' : 'hover:bg-slate-700'}`}
          type="button"
          onClick={() => onViewChange('inventory')}
        >
          <FiBox className="w-5 h-5" />
          <span>Inventario</span>
        </button>
        <button
          className={`flex items-center gap-3 px-4 py-3 rounded-xl text-slate-100 transition ${activeView === 'providers' ? 'bg-slate-700' : 'hover:bg-slate-700'}`}
          type="button"
          onClick={() => onViewChange('providers')}
        >
          <FiBox className="w-5 h-5" />
          <span>Proveedoras</span>
        </button>
        <button
          className={`flex items-center gap-3 px-4 py-3 rounded-xl text-slate-100 transition ${activeView === 'ventas' ? 'bg-slate-700' : 'hover:bg-slate-700'}`}
          type="button"
          onClick={() => onViewChange('ventas')}
        >
          <FiTrendingUp className="w-5 h-5" />
          <span>Ventas</span>
        </button>
        <button
          className={`flex items-center gap-3 px-4 py-3 rounded-xl text-slate-100 transition ${activeView === 'pagos' ? 'bg-slate-700' : 'hover:bg-slate-700'}`}
          type="button"
          onClick={() => onViewChange('pagos')}
        >
          <FiCreditCard className="w-5 h-5" />
          <span>Pagos</span>
        </button>
        <button
          className={`flex items-center gap-3 px-4 py-3 rounded-xl text-slate-100 transition ${activeView === 'facturacion' ? 'bg-slate-700' : 'hover:bg-slate-700'}`}
          type="button"
          onClick={() => onViewChange('facturacion')}
        >
          <FiCreditCard className="w-5 h-5" />
          <span>Facturación</span>
        </button>
      </nav>
    </aside>
  );
}

export default Sidebar;
