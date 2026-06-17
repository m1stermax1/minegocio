import { Fragment, useState, useMemo } from "react";

export default function SalesTable({ sales = [], salesItems = [] }) {
  const [expandedSale, setExpandedSale] = useState(null);
  const [dateFilter, setDateFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const toggleExpanded = (index) => {
    setExpandedSale((prev) => (prev === index ? null : index));
  };

  const formatDateArg = (dateStr) => {
    if (!dateStr) return "-";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const filteredSales = useMemo(() => {
    //tenemos que traernos los sales items filtradors por cada  sale_id
    return sales?.data?.filter((sale) => {
      const saleDate = sale?.sale_date?.split("T")[0];

      if (!saleDate) return true;

      if (dateFilter) {
        return saleDate === dateFilter;
      }

      if (dateFrom) {
        if (saleDate < dateFrom) return false;
      }

      if (dateTo) {
        const toDate = dateTo;
        if (saleDate > toDate) return false;
      }

      return true;
    });
  }, [sales, dateFilter, dateFrom, dateTo]);

  console.log("Sales ITems: ", filteredSales);

  const filteredSalesById = (id) => {
    return salesItems?.filter((item) => item?.sale_id == id);
  };
  console.log("Sales ITems: ", filteredSalesById("6a8b0cf8-d704-4b37-8db9-1582689990f8"));


  if (!sales?.data?.length) {
    return <div className="table-state">No se encontraron ventas.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-3 items-center">
        <div className="mb-5 grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.85rem",
                marginBottom: "6px",
                fontWeight: 600,
                color: "var(--accent)",
              }}
            >
              Filtrar por fecha
            </label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setDateFrom("");
                setDateTo("");
              }}
              className="w-full px-3 py-2 rounded-lg bg-slate-900/60 border border-slate-700 text-slate-100 text-sm"
            />
          </div>
          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.85rem",
                marginBottom: "6px",
                fontWeight: 600,
                color: "var(--accent)",
              }}
            >
              Desde
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setDateFilter("");
              }}
              className="w-full px-3 py-2 rounded-lg bg-slate-900/60 border border-slate-700 text-slate-100 text-sm"
            />
          </div>
          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.85rem",
                marginBottom: "6px",
                fontWeight: 600,
                color: "var(--accent)",
              }}
            >
              Hasta
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setDateFilter("");
              }}
              className="w-full px-3 py-2 rounded-lg bg-slate-900/60 border border-slate-700 text-slate-100 text-sm"
            />
          </div>
          {(dateFilter || dateFrom || dateTo) && (
            <div className="flex items-end">
              <button
                type="button"
                className="bg-slate-900/40 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 w-full"
                onClick={() => {
                  setDateFilter("");
                  setDateFrom("");
                  setDateTo("");
                }}
              >
                Limpiar filtros
              </button>
            </div>
          )}
        </div>
        <div className="mb-3 text-sm text-slate-400">
          Mostrando {filteredSales.length} de {sales.length} ventas
        </div>
        <button
          className="bg-slate-900/40 border border-slate-700 text-slate-100 rounded-lg px-3 py-2"
          // onClick={handleAddSale}
        >
          Agregar venta
        </button>
      </div>

      <table className="w-full min-w-[760px] border-separate border-spacing-3">
        <thead>
          <tr>
            <th className="text-center">Fecha</th>
            <th className="text-center">Método</th>
            <th className="text-center">Total</th>
            <th className="text-center">Productos</th>
            <th className="text-center">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {filteredSales.map((sale, index) => (
            <Fragment key={`sale-${index}`}>
              <tr>
                <td className="text-center text-sm font-medium">
                  {formatDateArg(sale.sale_date)}
                </td>
                <td className="text-center">{sale.payment_method || "-"}</td>
                <td className="text-center">
                  $
                  {Number(sale.amount || 0).toLocaleString("es-AR", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                  })}
                </td>
                {/* //aca tambien */}
                <td className="text-center">{filteredSalesById(sale?.id)?.length || 'nada'}</td>
                <td className="flex justify-center">
                  <button
                    type="button"
                    className="bg-slate-900/40 border border-slate-700 text-slate-100 rounded-lg px-3 py-2"
                    onClick={() => toggleExpanded(index)}
                  >
                    {expandedSale === index ? "Ocultar" : "Ver productos"}
                  </button>
                </td>
              </tr>
              {expandedSale === index && (
                <tr>
                  <td colSpan={5}>
                    <div className="py-3">
                      <table className="w-full min-w-[720px] border-separate border-spacing-0">
                        <thead>
                          <tr>
                            <th className="text-start">Código</th>
                            <th>Descripción</th>
                            {/* <th>Proveedor</th> */}
                            <th>Precio</th>
                          </tr>
                        </thead>
                        <tbody>
                          {/* //esto tiene que ser reemplazada por el sales item de cada sale id */}
                          {filteredSalesById(sale?.id)?.map((item, itemIndex) => (
                            <tr key={`${index}-${itemIndex}`}>
                              <td className="text-start">{item.id || "-"}</td>
                              <td className="text-center">
                                {item.description || "-"}
                              </td>
                              {/* <td className="text-center">
                                {item.proveedora || "-"}
                              </td> */}
                              <td className="text-center">
                                $
                                {Number(item.unit_price || 0).toLocaleString(
                                  "es-AR",
                                  {
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 2,
                                  },
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
