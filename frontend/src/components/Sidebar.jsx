import { AiOutlineAppstore, AiOutlineDashboard } from "react-icons/ai";
import { FiBox, FiTrendingUp, FiCreditCard } from "react-icons/fi";
import { logoutUser } from "../services/authService.js";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase.js";
import { Link } from "react-router-dom";
import ThemeToggle from "./ThemeToggle.jsx";
import { getProfile, getOrganization } from "../services/users";
import { useState, useEffect } from "react";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: AiOutlineDashboard, view: "dashboard" },
  { to: "/inventory", label: "Inventario", icon: FiBox, view: "inventory" },
  { to: "/providers", label: "Proveedores", icon: FiBox, view: "providers" },
  { to: "/sales", label: "Ventas", icon: FiTrendingUp, view: "ventas" },
  { to: "/payments", label: "Pagos", icon: FiCreditCard, view: "pagos" },
  {
    to: "/billings",
    label: "Facturas",
    icon: FiCreditCard,
    view: "facturacion",
  },
];

function Sidebar({ activeView, isOpen, onClose }) {
  const navigate = useNavigate();
  const [orgName, setOrgName] = useState("Cargando...");

  const loadOrganizationName = async () => {
    try {
      const profileData = await getProfile();
      if (
        !profileData ||
        !Array.isArray(profileData) ||
        profileData.length === 0
      ) {
        setOrgName("Organización no encontrada");
        return;
      }
      const profile = profileData[0];
      const orgId = profile.organization_id;
      if (!orgId) {
        setOrgName("Sin organización asignada");
        return;
      }
      const organization = await getOrganization(orgId);

      setOrgName(organization?.name || "Organización sin nombre");
    } catch (err) {
      console.error("Error loading organization name:", err);
      setOrgName("Error");
    }
  };

  // Load organization name on component mount
  // We'll also reload if the user logs in/out? We don't have a way to detect that here.
  // We'll rely on the fact that the sidebar is remounted when the route changes? Not reliable.
  // For simplicity, we'll load on mount and also when the prop 'isOpen' changes? Not ideal.
  // We'll instead load in a useEffect with empty deps, and also we can listen to auth state changes if needed.
  // We'll add an effect that runs on mount and also when the user changes (we don't have a user change event).
  // We'll accept that it might be stale if the user changes organization while the app is open.
  // We'll load on mount and also when the component receives a new key? We'll just do on mount.
  // We'll also clear the orgName when the component unmounts? Not necessary.
  useEffect(() => {
    loadOrganizationName();
  }, []);

  const handleLogout = async () => {
    try {
      await logoutUser();
      // Clear organization name on logout? Not necessary as the component will be unmounted or re-mounted.
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
          <span className="sidebar-brand-name">{orgName}</span>
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
