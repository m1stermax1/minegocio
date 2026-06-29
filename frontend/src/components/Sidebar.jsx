import { AiOutlineAppstore, AiOutlineDashboard } from "react-icons/ai";
import { FiBox, FiTrendingUp, FiCreditCard } from "react-icons/fi";
import { logoutUser } from "../services/authService.js";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase.js";
import { Link } from "react-router-dom";
import ThemeToggle from "./ThemeToggle.jsx";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: AiOutlineDashboard, view: "dashboard" },
  { to: "/inventory", label: "Inventario", icon: FiBox, view: "inventory" },
  { to: "/providers", label: "Proveedores", icon: FiBox, view: "providers" },
  { to: "/sales", label: "Ventas", icon: FiTrendingUp, view: "ventas" },
  { to: "/payments", label: "Pagos", icon: FiCreditCard, view: "pagos" },
  { to: "/billings", label: "Facturas", icon: FiCreditCard, view: "facturacion" },
];

function Sidebar({ activeView, isOpen, onClose }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logoutUser();
      supabase.auth.onAuthStateChange((event) => {
        if (event === "SIGNED_OUT") {
          // limpiar estado global si fuera necesario
        }
      });
      navigate("/login");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      {isOpen && (
        <div
          className="sidebar-backdrop"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside className={`sidebar ${isOpen ? "is-open" : ""}`}>
        <div className="sidebar-brand">
          <AiOutlineAppstore className="sidebar-brand-icon" />
          <span className="sidebar-brand-name">Lila Feria Americana</span>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map(({ to, label, icon: Icon, view }) => {
            const isActive = activeView === view;
            return (
              <Link
                key={to}
                to={{ pathname: to }}
                className={`sidebar-link ${isActive ? "is-active" : ""}`}
                onClick={onClose}
              >
                <Icon />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <ThemeToggle />
          <button
            type="button"
            className="btn btn-ghost btn-block"
            style={{ color: "var(--sidebar-fg)", justifyContent: "flex-start" }}
            onClick={handleLogout}
          >
            <FiCreditCard className="w-5 h-5" />
            <span>Log Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;