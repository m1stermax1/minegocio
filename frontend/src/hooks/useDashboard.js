import { useEffect, useState } from "react";

import {
  getDashboardData,
  getInventory,
  getProviders,
  getSales,
} from "../services/dashboardService";

import {
  calculateMonthlyTotal,
  calculateTodayTotal,
  calculateBusinessProfit,
} from "../utils/dashboardCalculations";

export function useDashboard(refresh) {
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    inStockCount: 0,
    soldCount: 0,
    providersCount: 0,
    totalSold: 0,
    totalProfitToday: 0,
    businessProfit: 0,
  });

  const [inventory, setInventory] = useState([]);
  const [providers, setProviders] = useState([]);

  const loadDashboard = async () => {
    try {
      setLoading(true);

      const {
        dashboardData,
        providers,
        salesData,
        salesItems,
      } = await getDashboardData();

console.log("Dash", dashboardData)
      setStats({
        inStockCount: dashboardData?.inStockCount || 0,
        soldCount: dashboardData?.soldCount || 0,
        providersCount: providers?.data?.length || 0,
        totalSold: calculateMonthlyTotal(
          salesData?.data || []
        ),
        totalProfitToday: calculateTodayTotal(
          salesData?.data || []
        ),
        businessProfit: calculateBusinessProfit(
          salesItems?.data || []
        ),
      });
    } finally {
      setLoading(false);
    }
  };

  const loadInventory = async () => {
    const response = await getInventory();
    setInventory(response?.data || []);
  };

  const loadProviders = async () => {
    const response = await getProviders();
    setProviders(response?.data || []);
  };

  useEffect(() => {
    loadDashboard();
    loadInventory();
    loadProviders();
  }, [refresh]);

  return {
    loading,
    stats,
    inventory,
    providers,
    loadDashboard,
    loadInventory,
    loadProviders,
  };
}