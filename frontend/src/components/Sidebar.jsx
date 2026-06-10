import { AiOutlineAppstore, AiOutlineDashboard } from "react-icons/ai";
import { FiBox, FiTrendingUp, FiCreditCard } from "react-icons/fi";
import { logoutUser } from "../services/authService.js";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase.js";
import { Link } from "react-router-dom";

function Sidebar({ activeView, onViewChange }) {
  const navigate = useNavigate();
  const handleLogout = async () => {
    try {
      await logoutUser();
      supabase.auth.onAuthStateChange((event, session) => {
        if (event === "SIGNED_OUT") {
          // limpiar estado global
        }
      });
      navigate("/login");
    } catch (error) {
      console.error(error);
    }
  };
  return (
    <aside className="bg-slate-800 p-8 flex flex-col gap-8">
      <div className="flex items-center gap-4">
        <AiOutlineAppstore className="w-10 h-10 text-accent" />
        <div>
          <span className="text-lg font-semibold">Lila Feria Americana</span>
        </div>
      </div>

      <nav className="sidebar flex flex-col gap-2">
        <Link
          to={{ pathname: "/" }}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl text-slate-100 transition ${activeView === "dashboard" ? "bg-slate-700" : "hover:bg-slate-700"}`}
        >
          <AiOutlineDashboard className="w-5 h-5" />
          <span>Dashboard</span>
        </Link>
        <Link
        to={{ pathname: "/inventory" }}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl text-slate-100 transition ${activeView === "inventory" ? "bg-slate-700" : "hover:bg-slate-700"}`}
          type="button"
        >
          <FiBox className="w-5 h-5" />
          <span>Inventario</span>
        </Link>
        <Link to={{ pathname: "/providers" }}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl text-slate-100 transition ${activeView === "providers" ? "bg-slate-700" : "hover:bg-slate-700"}`}
          type="button"
        >
          <FiBox className="w-5 h-5" />
          <span>Proveedoras</span>
        </Link>
        <Link to={{ pathname: "/sales" }}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl text-slate-100 transition ${activeView === "ventas" ? "bg-slate-700" : "hover:bg-slate-700"}`}
          type="button"
        >
          <FiTrendingUp className="w-5 h-5" />
          <span>Ventas</span>
        </Link>
        <Link to={{ pathname: "/payments" }}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl text-slate-100 transition ${activeView === "pagos" ? "bg-slate-700" : "hover:bg-slate-700"}`}
          type="button"
        
        >
          <FiCreditCard className="w-5 h-5" />
          <span>Pagos</span>
        </Link>
        <Link to={{ pathname: "/billings" }}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl text-slate-100 transition ${activeView === "facturacion" ? "bg-slate-700" : "hover:bg-slate-700"}`}
          type="button"
        >
          <FiCreditCard className="w-5 h-5" />
          <span>Facturación</span>
        </Link>
        <button
          className={`flex items-center gap-3 px-4 py-3 rounded-xl text-slate-100 transition ${activeView === "facturacion" ? "bg-slate-700" : "hover:bg-slate-700"}`}
          type="button"
          onClick={handleLogout}
        >
          <FiCreditCard className="w-5 h-5" />
          <span>Log Out</span>
        </button>
      </nav>
    </aside>
  );
}

export default Sidebar;
