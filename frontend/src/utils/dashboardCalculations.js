export function calculateTodayTotal(sales) {
  const now = new Date();

  const todaySales = sales.filter((sale) => {
    const saleDate = new Date(sale.sale_date);

    return (
      saleDate.getFullYear() === now.getFullYear() &&
      saleDate.getMonth() === now.getMonth() &&
      saleDate.getDate() === now.getDate()
    );
  });

  return todaySales.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );
}

export function calculateMonthlyTotal(sales) {
  const now = new Date();

  return sales.reduce((total, sale) => {
    const saleDate = new Date(sale.sale_date);

    if (
      saleDate.getMonth() === now.getMonth() &&
      saleDate.getFullYear() === now.getFullYear()
    ) {
      return total + Number(sale.amount || 0);
    }

    return total;
  }, 0);
}

export function calculateBusinessProfit(salesItems) {
  return salesItems.reduce(
    (sum, item) => sum + Number(item.profit || 0),
    0
  );
}

function startOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  // week starts on Monday
  const diff = (day === 0 ? -6 : 1) - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function calculateWeeklyTotal(sales) {
  const now = new Date();
  const start = startOfWeek(now);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);

  return sales.reduce((total, sale) => {
    const saleDate = new Date(sale.sale_date);
    if (saleDate >= start && saleDate < end) {
      return total + Number(sale.amount || 0);
    }
    return total;
  }, 0);
}

export function calculateProfitForPeriod(salesItems, period = "day") {
  const now = new Date();

  const inPeriod = (date) => {
    const d = new Date(date);
    if (period === "day") {
      return (
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate()
      );
    }
    if (period === "week") {
      const start = startOfWeek(now);
      const end = new Date(start);
      end.setDate(start.getDate() + 7);
      return d >= start && d < end;
    }
    if (period === "month") {
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    }
    return false;
  };

  return salesItems.reduce((sum, item) => {
    const dateStr = item.created_at || item.sale_date || item.date;
    if (!dateStr) return sum;
    if (inPeriod(dateStr)) return sum + Number(item.profit || 0);
    return sum;
  }, 0);
}

export function formatCurrency(value) {
  return `$ ${Number(value || 0).toLocaleString("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

export function countItemsForPeriod(salesItems, period = "day") {
  const now = new Date();

  const inPeriod = (date) => {
    const d = new Date(date);
    if (period === "day") {
      return (
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate()
      );
    }
    if (period === "week") {
      const start = startOfWeek(now);
      const end = new Date(start);
      end.setDate(start.getDate() + 7);
      return d >= start && d < end;
    }
    if (period === "month") {
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    }
    return false;
  };

  return salesItems.reduce((sum, item) => {
    const dateStr = item.created_at || item.sale_date || item.date;
    if (!dateStr) return sum;
    if (inPeriod(dateStr)) return sum + (Number(item.quantity) || 1);
    return sum;
  }, 0);
}

export function averageSaleAmountForPeriod(sales, period = "month") {
  const now = new Date();

  const inPeriod = (date) => {
    const d = new Date(date);
    if (period === "day") {
      return (
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate()
      );
    }
    if (period === "week") {
      const start = startOfWeek(now);
      const end = new Date(start);
      end.setDate(start.getDate() + 7);
      return d >= start && d < end;
    }
    if (period === "month") {
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    }
    return false;
  };

  const filtered = (sales || []).filter((s) => inPeriod(s.sale_date));
  if (!filtered.length) return 0;
  const total = filtered.reduce((sum, s) => sum + Number(s.amount || 0), 0);
  return total / filtered.length;
}

export function topProductsForPeriod(salesItems, period = "month", topN = 3) {
  const now = new Date();
  const inPeriod = (date) => {
    const d = new Date(date);
    if (period === "day") {
      return (
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate()
      );
    }
    if (period === "week") {
      const start = startOfWeek(now);
      const end = new Date(start);
      end.setDate(start.getDate() + 7);
      return d >= start && d < end;
    }
    if (period === "month") {
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    }
    return false;
  };

  const counts = (salesItems || []).reduce((acc, item) => {
    const dateStr = item.created_at || item.sale_date || item.date;
    if (!dateStr || !inPeriod(dateStr)) return acc;
    const key = item.product_id || item.description || "unknown";
    acc[key] = (acc[key] || 0) + (Number(item.quantity) || 1);
    return acc;
  }, {});

  const sorted = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([key, qty]) => ({ key, qty }));

  return sorted;
}
