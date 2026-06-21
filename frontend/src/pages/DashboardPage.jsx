import { useEffect, useState } from "react";
import {
  fetchInventory,
  fetchDashboardCounts,
  fetchProviders,
  fetchSales,
  fetchOwnerTotal,
  fetchSalesItems,
} from "../services/api.js";
import Sidebar from "../components/Sidebar.jsx";
import SearchBar from "../components/SearchBar.jsx";
import ProvidersFormModal from "../components/ProvidersFormModal.jsx";
import ItemsFormModal from "../components/ItemsFormModal.jsx";
import SalesModal from "../components/SalesModal.jsx";
import MessageForProvidersModal from "../components/messagesForProvidersModal.jsx";
import { getProfile } from "../services/users.js";

function StatCard({ title, value, subtitle }) {
  return (
    <div className="dashboard-card bg-slate-800 border border-slate-700 rounded-2xl p-5 shadow">
      <p className="text-sm text-slate-400 tracking-wide">{title}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      {subtitle && <p className="text-sm text-slate-400 mt-1">{subtitle}</p>}
    </div>
  );
}

export default function DashboardPage({ refresh }) {
  const [counts, setCounts] = useState({ inStockCount: 0, soldCount: 0 });
  const [providersCount, setProvidersCount] = useState(0);
  const [totalSold, setTotalSold] = useState(0);
  const [totalOwner, setTotalOwner] = useState(0);
  const [loading, setLoading] = useState(true);
  const [totalProfitToday, setTotalProfitToday] = useState("");
  const [salesItems, setSalesItems] = useState([]);
  const [profitBusiness, setProfitBusiness] = useState([]);

  const [dashboardRefresh, setDashboardRefresh] = useState(0);

  const [providers, setProviders] = useState([]);
  const [providersRefresh, setProvidersRefresh] = useState(0);

  const [inventory, setInventory] = useState([]);

  const [sales, setSales] = useState([]);

  const [notification, setNotification] = useState("");

  const [showItemsModal, setShowItemsModal] = useState(false);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [showProvidersModal, setShowProvidersModal] = useState(false);
  // const [showMessagesForProvidersModal, setShowMessagesForProvidersModal] =
  //   useState(false);

  const [loadingInventory, setLoadingInventory] = useState(true);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [loadingSales, setLoadingSales] = useState(false);
  const [loadingPayments, setLoadingPayments] = useState(false);

  const showNotification = (message) => {
    setNotification(message);

    window.setTimeout(() => {
      setNotification("");
    }, 3200);
  };

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        const [dashboardData, providers, salesData, saleItems] =
          await Promise.all([
            fetchDashboardCounts(),
            fetchProviders(),
            fetchSales(),
            fetchSalesItems(),
            // fetchOwnerTotal(),
          ]);
        if (mounted) {
          const totalPrice = salesData?.data?.reduce(
            (sum, item) => sum + (Number(item?.profit) || 0),
            0,
          );

          const profitForBoss = salesItems?.reduce(
            (sum, item) => sum + (Number(item?.profit) || 0),
            0,
          );
          setSalesItems(saleItems?.data);
          setProfitBusiness(profitForBoss);

          console.log("Dashboard Data:", dashboardData);
          console.log("Sales Items:", salesItems);
          console.log("Total profilt:", totalPrice);
          setCounts(dashboardData || { inStockCount: 0, soldCount: 0 });
          setProvidersCount(providers?.data?.length || 0);

          // Calcular totales del mes actual
          const now = new Date();
          const todaySales = salesData?.data?.filter((sale) => {
            const saleDate = new Date(sale?.sale_date);

            return (
              saleDate.getFullYear() === now.getFullYear() &&
              saleDate.getMonth() === now.getMonth() &&
              saleDate.getDate() === now.getDate()
            );
          });
          const totalProfitOfToday = todaySales?.reduce(
            (sum, item) => sum + (Number(item?.amount) || 0),
            0,
          );
          setTotalProfitToday(totalProfitOfToday);

          const currentMonth = now.getUTCMonth() + 1;
          const currentYear = now.getFullYear();

          // total vendido (suma de salesData por el mes)
          let monthlyTotal = 0;
          (salesData?.data || []).forEach((sale) => {
            const saleDate = new Date(sale.sale_date);
            if (
              saleDate &&
              saleDate.getMonth() + 1 === currentMonth &&
              saleDate.getFullYear() === currentYear
            ) {
              monthlyTotal += Number(sale.amount) || 0;
            }
          });

          setTotalSold(monthlyTotal);
          // ownerTotal viene calculado en backend: suma por item de (precio venta (col D) - precio sugerido(col C)*0.6)
          console.log("Business Profit", profitForBoss);
          setTotalOwner(profitForBoss || 0);
        }
      } catch (err) {
        console.error("Error cargando dashboard:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => (mounted = false);
  }, [refresh, providers, inventory]);

  const formatCurrency = (value) => {
    return `$ ${Number(value || 0)?.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  };
  const loadInventory = async () => {
    try {
      setLoadingInventory(true);
      const data = await fetchInventory();
      setInventory(data?.data);
    } catch (error) {
      console.error("Error cargando inventario:", error);
      setInventory([]);
    } finally {
      setLoadingInventory(false);
    }
  };
  const loadSales = async () => {
    try {
      setLoadingSales(true);
      const data = await fetchSales();
      setSales(data);
    } catch (error) {
      console.error("Error cargando ventas:", error);
      setSales([]);
    } finally {
      setLoadingSales(false);
    }
  };
  const loadProviders = async () => {
    try {
      setLoadingProviders(true);

      const providersList = await fetchProviders();
      setProviders(providersList.data);
    } catch (error) {
      console.error("Error cargando proveedoras:", error);
      setProviders([]);
    } finally {
      setLoadingProviders(false);
    }
  };

  const handleAddItem = () => {
    setShowItemsModal(true);
  };
  const handleAddSale = async () => {
    const updatedInventory = await fetchInventory();
    setInventory(updatedInventory?.data);
    setLoadingInventory(false);
    if (!inventory?.length) {
      await loadInventory();
    }
    setShowSaleModal(true);
  };
  const handleProviderAdded = async () => {
    await loadProviders();

    setProvidersRefresh((prev) => prev + 1);
    setDashboardRefresh((prev) => prev + 1);

    showNotification("Proveedora agregada correctamente.");
  };
  const handleItemAdded = () => {
    loadInventory();
    // setDashboardRefresh((prev) => prev + 1);
    showNotification("Item agregado correctamente a la lista.");
  };
  const handleSaleCreated = () => {
    loadInventory();
    loadSales();

    setDashboardRefresh((prev) => prev + 1);

    showNotification("Venta cargada correctamente.");
  };

  // const showNotification = (message) => {
  //   setNotification(message);

  //   window.setTimeout(() => {
  //     setNotification("");
  //   }, 3200);
  // };

  return (
    <div className="min-h-screen md:grid md:grid-cols-[280px_1fr]">
      <Sidebar activeView="dashboard" />

      <main className="p-8">
        <div>
          <div className="flex items-end justify-between gap-6 mb-7">
            <div>
              <p className="text-accent uppercase tracking-widest text-xs mb-1">
                Panel
              </p>

              <h1 className="text-3xl md:text-4xl m-0">Dashboard</h1>
            </div>
          </div>

          <section className="bg-slate-800/70 border border-slate-700 rounded-2xl p-7 min-h-[72vh] shadow-soft">
            <div className="grid grid-cols-[1fr_max-content] gap-4 items-center mb-6">
              <div className="flex gap-3 items-center">
                <button
                  className="bg-slate-900/40 border border-slate-700 text-slate-100 rounded-lg px-3 py-2"
                  onClick={handleAddItem}
                >
                  Agregar producto
                </button>

                <button
                  className="bg-slate-900/40 border border-slate-700 text-slate-100 rounded-lg px-3 py-2"
                  onClick={handleAddSale}
                >
                  Agregar venta
                </button>

                <button
                  className="bg-slate-900/40 border border-slate-700 text-slate-100 rounded-lg px-3 py-2"
                  onClick={() => setShowProvidersModal(true)}
                >
                  Agregar proveedora
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading ? (
                <p>Cargando...</p>
              ) : (
                <>
                  <StatCard
                    title="Productos en stock"
                    value={counts.inStockCount}
                  />
                  <StatCard
                    title="Productos vendidos"
                    value={counts.soldCount}
                  />
                  <StatCard title="Proveedoras" value={providersCount} />
                  <StatCard
                    title="Total vendido este mes"
                    value={formatCurrency(totalSold)}
                  />
                  {/* <StatCard
                    title="Total para negocio"
                    value={formatCurrency(totalOwner)}
                  /> */}

                  <StatCard
                    title="Total Hoy"
                    value={formatCurrency(totalProfitToday)}
                  />

                  <StatCard
                    title="Total Para mi Hoy"
                    value={formatCurrency(profitBusiness)}
                  />
                </>
              )}
            </div>
          </section>
        </div>
      </main>

      <ProvidersFormModal
        isOpen={showProvidersModal}
        onClose={() => setShowProvidersModal(false)}
        onProviderAdded={handleProviderAdded}
        inventoryItems={inventory}
      />

      <ItemsFormModal
        isOpen={showItemsModal}
        onClose={() => setShowItemsModal(false)}
        onItemsAdded={handleItemAdded}
        providers={providers}
        providersRefresh={providersRefresh}
      />

      <SalesModal
        isOpen={showSaleModal}
        onClose={() => setShowSaleModal(false)}
        inventoryItems={inventory}
        isLoadingInventory={loadingInventory}
        onSaleCreated={handleSaleCreated}
      />
    </div>
  );
}
