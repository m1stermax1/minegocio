export default function DashboardActions({
  onAddItem,
  onAddSale,
  onAddProvider,
}) {
  return (
    <div className="flex gap-3 items-center pbe-8">
      <button
        className="bg-slate-900/40 border border-slate-700 text-slate-100 rounded-lg px-3 py-2"
        onClick={onAddItem}
      >
        Agregar producto
      </button>

      <button
        className="bg-slate-900/40 border border-slate-700 text-slate-100 rounded-lg px-3 py-2"
        onClick={onAddSale}
      >
        Agregar venta
      </button>

      <button
        className="bg-slate-900/40 border border-slate-700 text-slate-100 rounded-lg px-3 py-2"
        onClick={onAddProvider}
      >
        Agregar proveedora
      </button>
    </div>
  );
}