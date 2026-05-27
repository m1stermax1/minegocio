function SearchBar({ query, onChange }) {
  return (
    <div className="grid gap-2 mb-6">
      <label htmlFor="search-input" className="text-slate-400 text-sm">
        Buscar producto
      </label>
      <input
        id="search-input"
        value={query}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Buscar por código o descripción..."
        className="w-full rounded-xl bg-slate-900/60 border border-slate-700 px-4 py-3 text-slate-100 outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
      />
    </div>
  );
}

export default SearchBar;
