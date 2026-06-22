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

export function formatCurrency(value) {
  return `$ ${Number(value || 0).toLocaleString("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}