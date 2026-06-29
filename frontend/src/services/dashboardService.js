import {
  fetchDashboardCounts,
  fetchProviders,
  fetchSales,
  fetchSalesItems, 
  fetchInventory,
} from "./api";

export async function getDashboardData() {
  const [dashboardData, providers, salesData, salesItems] =
    await Promise.all([
      fetchDashboardCounts(),
      fetchProviders(),
      fetchSales(),
      fetchSalesItems(),
    ]);

  return {
    dashboardData,
    providers,
    salesData,
    salesItems,
  };
}

export async function getInventory({ all = true } = {}) {
  return await fetchInventory(null, null, null, all);
}

export async function getProviders() {
  return await fetchProviders();
}

export async function getSales() {
  return await fetchSales();
}