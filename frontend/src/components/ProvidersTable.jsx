import { useEffect, useState } from "react";

function ProvidersTable({ items, loading }) {
  const [tableItems, setTableItems] = useState([]);

  useEffect(() => {
    setTableItems(items);
  }, [items]);

  if (loading) {
    return (
      <div className="table-state">
        Cargando proveedoras...
      </div>
    );
  }

  if (!tableItems.length) {
    return (
      <div className="table-state">
        No se encontraron proveedoras.
      </div>
    );
  }

  return (
    <div className="table-wrapper">
      <table className="table providers-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Descripción</th>
            <th>Precio</th>
            <th>% Ganancia</th>
            <th>Estado</th>
            <th>Pagado</th>
          </tr>
        </thead>
        <tbody>
          {tableItems.map((item) => (
            <tr key={item.id}>
              <td>{item.nombre || "-"}</td>
              <td>{item.descripcion || "-"}</td>
              <td>$ {(item.precio * 1000).toLocaleString("es-AR") || "-"}</td>
              <td>$ {((item.precio * 0.6) * 1000).toLocaleString("es-AR") || "-"}</td>
              <td>
                <span className={`status-badge ${item.estado === 'vendido' ? 'vendido' : 'stock'}`}>
                  {item.estado || "-"}
                </span>
              </td>
              <td>
                <span className={`payment-badge ${item.pago === 'pagado' ? 'paid' : 'unpaid'}`}>
                  {item.pago || "impago"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ProvidersTable;
