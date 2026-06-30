import { useEffect, useState } from "react";
import { fetchSales, fetchSalesItems } from "../services/api.js";
import Sidebar from "../components/Sidebar.jsx";
import MobileHeader from "../components/MobileHeader.jsx";
import SalesModal from "../components/SalesModal.jsx";
import SalesTable from "./../components/SalesTable.jsx";
import PaginationComponent from "../components/PaginationComponent.jsx";

export default function SalesPage() {
  const [loading, setLoading] = useState(true);
  const [sales, setSales] = useState([]);
  const [totalSales, setTotalSales] = useState(0);
  const [salesItems, setSalesItems] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const LIMIT = 10;

  const loadSales = async (page) => {
    try {
      setLoading(true);
      const data = await fetchSales(page, LIMIT);
      setSales(data.data ?? []);
      setTotalSales(data.total ?? 0);
    } catch (error) {
      console.error("Error cargando ventas:", error);
      setSales([]);
      setTotalSales(0);
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
    loadSales(currentPage);
    loadSalesItems();
  }, [currentPage]);

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

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          marginTop: "1rem",
        }}
      >
        <p>
          Mostrando{" "}
          {totalSales === 0
            ? 0
            : (currentPage - 1) * LIMIT + 1}
          {"-"}
          {Math.min(
            currentPage * LIMIT,
            totalSales
          )} de {totalSales} ventas
        </p>
      </div>

      <div
        style={{ display: "flex", justifyContent: "center", marginTop: "1rem" }}
      >
        <PaginationComponent
          totalPages={Math.ceil(totalSales / LIMIT)}
          currentPage={currentPage}
          onChangePage={setCurrentPage}
        />
      </div>

      <SalesModal />
    </div>
  );
}