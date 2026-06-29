import { FiMenu } from "react-icons/fi";

function MobileHeader({ title, eyebrow, onMenuClick }) {
  return (
    <div className="mobile-header">
      <button
        type="button"
        className="btn btn-ghost btn-icon"
        onClick={onMenuClick}
        aria-label="Abrir menú"
      >
        <FiMenu size={20} />
      </button>
      {title && (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {eyebrow && (
            <span
              style={{
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                fontSize: "0.7rem",
                color: "var(--primary)",
                fontWeight: 600,
              }}
            >
              {eyebrow}
            </span>
          )}
          <span style={{ fontWeight: 600, fontSize: "1rem" }}>{title}</span>
        </div>
      )}
    </div>
  );
}

export default MobileHeader;
