import { useEffect, useState } from "react";
import { fetchSales, fetchSalesItems } from "../services/api.js";
import Sidebar from "../components/Sidebar.jsx";
import SearchBar from "../components/SearchBar.jsx";
import SalesModal from "../components/SalesModal.jsx";
import SalesTable from "../components/SalesTable.jsx";

export default function SalesPage() {
  const [loading, setLoading] = useState(true);
  const [sales, setSales] = useState([]);
  const [salesItems, setSalesItems] = useState([]);

  const [showSaleModal, setShowSaleModal] = useState(false);
  //   const [loadingSales, setLoadingSales] = useState(false);

  const parseSaleDate = (dateString) => {
    if (!dateString) return null;

    // formato YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const [year, month, day] = dateString.split("-").map(Number);

      return new Date(year, month - 1, day);
    }

    // fallback para fechas viejas ISO
    const parsed = new Date(dateString);

    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

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

  const loadSalesItems = async (id) => {
    try {
      const data = await fetchSalesItems();
      
      console.log("Se ejecuta el sales items", data);
      setSalesItems(data);
    } catch (error) {
      console.error("Error cargando ventas:", error);
      setSales([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSales();
    loadSalesItems();
  }, []);

  console.log(sales);
  console.log(loading);
  console.log(salesItems);

  return (
    <div className="min-h-screen md:grid md:grid-cols-[280px_1fr]">
      <Sidebar activeView="sales" />

      <main className="p-8">
        <div>
          <div className="flex items-end justify-between gap-6 mb-7">
            <div>
              <p className="text-accent uppercase tracking-widest text-xs mb-1">
                Panel
              </p>

              <h1 className="text-3xl md:text-4xl m-0">Ventas</h1>
            </div>
          </div>

          <section className="bg-slate-800/70 border border-slate-700 rounded-2xl p-7 min-h-[72vh] shadow-soft">
            {loading ? (
              <p>Cargando...</p>
            ) : (
              <>
                <SalesTable sales={sales} salesItems={salesItems?.data} />
              </>
            )}
          </section>
        </div>
      </main>

      <SalesModal
      // isOpen={showSaleModal}
      // onClose={() => setShowSaleModal(false)}
      // // inventoryItems={inventory}
      // // isLoadingInventory={loadingInventory}
      // onSaleCreated={handleSaleCreated}
      />
    </div>
  );
}
