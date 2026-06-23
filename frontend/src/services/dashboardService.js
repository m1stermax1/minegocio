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

  console.log("Sales Items en getDashboardData", salesItems)

  return {
    dashboardData,
    providers,
    salesData,
    salesItems,
  };
}

export async function getInventory() {
  return await fetchInventory();
}

export async function getProviders() {
  return await fetchProviders();
}

export async function getSales() {
  return await fetchSales();
}