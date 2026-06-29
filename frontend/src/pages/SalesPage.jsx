import { useEffect, useState } from "react";
import { fetchSales, fetchSalesItems } from "../services/api.js";
import Sidebar from "../components/Sidebar.jsx";
import MobileHeader from "../components/MobileHeader.jsx";
import SalesModal from "../components/SalesModal.jsx";
import SalesTable from "../components/SalesTable.jsx";

export default function SalesPage() {
  const [loading, setLoading] = useState(true);
  const [sales, setSales] = useState([]);
  const [salesItems, setSalesItems] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const loadSales = async () => {
    try {
      setLoading(false);
      const data = await fetchSales();
      setSales(data);
    } catch (error) {
      console.error("Error cargando ventas:", error);
      setSales([]);
    } finally {
      setLoading(false);
    }
  };

  const loadSalesItems = async () => {
    try {
      const data = await fetchSalesItems();
      setSalesItems(data);
    } catch (error) {
      console.error("Error cargando ventas:", error);
      setSalesItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSales();
    loadSalesItems();
  }, []);

  return (
    <div className="page">
      <Sidebar
        activeView="ventas"
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <main className="page-main">
        <MobileHeader
          eyebrow="Panel"
          title="Ventas"
          onMenuClick={() => setIsSidebarOpen(true)}
        />

        <div className="page-header">
          <div>
            <p className="page-header-eyebrow">Panel</p>
            <h1 className="page-title">Ventas</h1>
          </div>
        </div>

        <section className="page-section">
          {loading ? (
            <div className="table-state">Cargando ventas...</div>
          ) : (
            <SalesTable sales={sales} salesItems={salesItems?.data} />
          )}
        </section>
      </main>

      <SalesModal />
    </div>
  );
}