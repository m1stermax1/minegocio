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
  calculateWeeklyTotal,
  calculateProfitForPeriod,
  countItemsForPeriod,
  averageSaleAmountForPeriod,
  topProductsForPeriod,
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

      setStats({
        inStockCount: dashboardData?.inStockCount || 0,
        soldCount: dashboardData?.soldCount || 0,
        providersCount: providers?.data?.length || 0,
        totalSold: calculateMonthlyTotal(
          salesData?.data || []
        ),
        totalProfitToday: calculateTodayTotal(salesData?.data || []),
        businessProfit: calculateBusinessProfit(salesItems?.data || []),
        // breakdowns
        today: {
          total: calculateTodayTotal(salesData?.data || []),
          local: calculateProfitForPeriod(salesItems?.data || [], "day"),
          providers: calculateTodayTotal(salesData?.data || []) - calculateProfitForPeriod(salesItems?.data || [], "day"),
        },
        weekly: {
          total: calculateWeeklyTotal(salesData?.data || []),
          local: calculateProfitForPeriod(salesItems?.data || [], "week"),
          providers: calculateWeeklyTotal(salesData?.data || []) - calculateProfitForPeriod(salesItems?.data || [], "week"),
        },
        monthly: {
          total: calculateMonthlyTotal(salesData?.data || []),
          local: calculateProfitForPeriod(salesItems?.data || [], "month"),
          providers: calculateMonthlyTotal(salesData?.data || []) - calculateProfitForPeriod(salesItems?.data || [], "month"),
        },
        // product counts
        counts: {
          today: countItemsForPeriod(salesItems?.data || [], "day"),
          weekly: countItemsForPeriod(salesItems?.data || [], "week"),
          monthly: countItemsForPeriod(salesItems?.data || [], "month"),
        },
        // average ticket
        avgTicket: {
          today: averageSaleAmountForPeriod(salesData?.data || [], "day"),
          weekly: averageSaleAmountForPeriod(salesData?.data || [], "week"),
          monthly: averageSaleAmountForPeriod(salesData?.data || [], "month"),
        },
        topProducts: {
          monthly: topProductsForPeriod(salesItems?.data || [], "month", 3),
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const loadInventory = async () => {
    const response = await getInventory({ all: true });
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