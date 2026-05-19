function SearchBar({ query, onChange }) {
  return (
    <div className="search-bar">
      <label htmlFor="search-input" className="search-label">
        Buscar producto
      </label>
      <input
        id="search-input"
        value={query}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Buscar por código o descripción..."
        className="search-input"
      />
    </div>
  );
}

export default SearchBar;
