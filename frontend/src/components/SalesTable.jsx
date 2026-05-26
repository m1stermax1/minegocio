import { Fragment, useState } from "react";

export default function SalesTable({ sales = [], loading }) {
  const [expandedSale, setExpandedSale] = useState(null);

  const toggleExpanded = (index) => {
    setExpandedSale((prev) => (prev === index ? null : index));
  };

  if (loading) {
    return <div className="table-state">Cargando ventas...</div>;
  }

  if (!sales.length) {
    return <div className="table-state">No se encontraron ventas.</div>;
  }

  return (
    <div className="table-wrapper">
      <table className="inventory-table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Método</th>
            <th>Total</th>
            <th>Productos</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {sales.map((sale, index) => (
            <Fragment key={`sale-${index}`}>
              <tr>
                <td>{sale.fecha || "-"}</td>
                <td>{sale.metodoPago || "-"}</td>
                <td>${Number(sale.montoTotal || 0).toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</td>
                <td>{sale.items?.length || 0}</td>
                <td>
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() => toggleExpanded(index)}
                  >
                    {expandedSale === index ? "Ocultar" : "Ver productos"}
                  </button>
                </td>
              </tr>
              {expandedSale === index && (
                <tr>
                  <td colSpan={5}>
                    <div className="provider-items-table-wrapper" style={{ padding: "12px 0" }}>
                      <table className="inventory-table">
                        <thead>
                          <tr>
                            <th>Código</th>
                            <th>Descripción</th>
                            <th>Proveedor</th>
                            <th>Precio</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sale.items?.map((item, itemIndex) => (
                            <tr key={`${index}-${itemIndex}`}>
                              <td>{item.codigo || "-"}</td>
                              <td>{item.descripcion || "-"}</td>
                              <td>{item.proveedora || "-"}</td>
                              <td>${Number(item.precio || 0).toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</td>
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