import { useState, useEffect } from "react";
import { FaCheck } from "react-icons/fa";
import { updateInventoryRowStatus } from "../services/api.js";

function InventoryTable({ items, loading }) {
  const [selectedItems, setSelectedItems] = useState([]);
  const [tableItems, setTableItems] = useState([]);

   useEffect(() => {
    setTableItems(items);
  }, [items]);

  if (loading) {
    return (
      <div className="table-state">
        Cargando inventario...
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="table-state">
        No se encontraron productos.
      </div>
    );
  }

  const toggleSelect = (itemId) => {
    setSelectedItems((prev) => {
      if (prev.includes(itemId)) {
        return prev.filter((id) => id !== itemId);
      }

      return [...prev, itemId];
    });
  };

  const isSelected = (itemId) => {
    return selectedItems.includes(itemId);
  };

  const toggleStatus = async (itemId) => {
    const currentItem = tableItems.find((item) => item.id === itemId);
    if (!currentItem) return;

    const nextState =
      currentItem.estado?.toLowerCase() === "vendido"
        ? "en stock"
        : "vendido";

    setTableItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id === itemId) {
          return {
            ...item,
            estado: nextState,
          };
        }

        return item;
      }),
    );

    try {
      await updateInventoryRowStatus(itemId, nextState);
    } catch (error) {
      console.error('Error actualizando estado en Sheets:', error);
    }
  };

  return (
    <div className="table-wrapper">

      {/* HEADER ACCIONES */}
      <div className="table-actions">
        <span>
          Seleccionados: {selectedItems.length}
        </span>

        <button
          className="bulk-action-btn"
          disabled={!selectedItems.length}
        >
          Acción masiva
        </button>
      </div>

      <table className="inventory-table">
        <thead>
          <tr>
            <th>Acción</th>
            <th>Código</th>
            <th>Descripción</th>
            <th>Precio</th>
            <th>Proveedor</th>
            <th>Estado</th>
          </tr>
        </thead>

        <tbody>
          {tableItems.map((item, index) => (
            <tr
              key={`${item.codigo}-${index}`}
              className={
                isSelected(item.id)
                  ? "selected-row"
                  : ""
              }
            >

              {/* CHECK */}
              <td>
                <button
                  className={`check-btn ${
                    isSelected(item.id)
                      ? "active"
                      : ""
                  }`}
                  onClick={() =>
                    toggleSelect(item.id)
                  }
                >
                  <FaCheck />
                </button>
              </td>

              <td>{item.codigo}</td>

              <td>{item.descripcion}</td>

              <td>$ {(item.precio * 1000).toLocaleString("es-AR")}</td>

              <td>{item.proveedora}</td>

              {/* STATUS */}
              <td>
                <button
                  onClick={() =>
                    toggleStatus(item.id)
                  }
                  className={`status-badge ${
                    item.estado?.toLowerCase()
                  }`}
                >
                  {item.estado}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default InventoryTable;