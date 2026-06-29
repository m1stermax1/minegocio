function SearchBar({ query, onChange }) {
  return (
    <div style={{ display: "grid", gap: "0.5rem" }}>
      <label htmlFor="search-input" className="label-muted">
        Buscar producto
      </label>
      <input
        id="search-input"
        value={query ?? ""}
        onChange={(event) => onChange?.(event.target.value)}
        placeholder="Buscar por código o descripción..."
        className="input"
      />
    </div>
  );
}

export default SearchBar;