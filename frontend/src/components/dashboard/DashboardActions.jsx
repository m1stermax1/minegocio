export default function DashboardActions({ onAddItem, onAddSale, onAddProvider, onCloseDay }) {
  return (
    <div className="flex gap-3 items-center mb-6 flex-wrap">
      <button type="button" className="btn btn-primary" onClick={onAddItem}>
        Agregar producto
      </button>
      <button type="button" className="btn btn-primary" onClick={onAddSale}>
        Agregar venta
      </button>
      <button type="button" className="btn btn-primary" onClick={onAddProvider}>
        Agregar proveedora
      </button>
      <button type="button" className="btn btn-primary" onClick={onCloseDay}>
        Cerrar día
      </button>
    </div>
  );
}