function SearchBar({
  query,
  onChange,
  label = "Buscar producto",
  placeholder = "Buscar por código o descripción...",
}) {
  return (
    <div style={{ display: "grid", gap: "0.5rem" }}>
      <label htmlFor="search-input" className="label-muted">
        {label}
      </label>
      <input
        id="search-input"
        value={query ?? ""}
        onChange={(event) => onChange?.(event.target.value)}
        placeholder={placeholder}
        className="input"
      />
    </div>
  );
}

export default SearchBar;
