function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirmar eliminación",
  count = 0,
  entityLabel = "elementos",
  impactSummary,
  warning,
  actions = [],
  loading = false,
}) {
  if (!isOpen) return null;

  const handleAction = (value) => {
    return async () => {
      await onConfirm?.(value);
      onClose?.();
    };
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-container modal-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h2 className="modal-title">{title}</h2>
            <p className="modal-subtitle">
              Esta acción no se puede deshacer.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-icon"
            onClick={onClose}
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <div className="modal-body" style={{ display: "grid", gap: "1rem" }}>
          {count > 0 && (
            <div className="alert alert-warning">
              Vas a eliminar <strong>{count}</strong>{" "}
              {count === 1 ? entityLabel : `${entityLabel}s`}.
            </div>
          )}

          {impactSummary && (
            <div className="alert alert-info">{impactSummary}</div>
          )}

          {warning && <div className="alert alert-error">{warning}</div>}

          <div style={{ display: "grid", gap: "0.75rem" }}>
            {actions.map((action) => (
              <button
                key={action.value}
                type="button"
                className={`btn ${
                  action.danger ? "btn-danger" : "btn-primary"
                } btn-block`}
                onClick={handleAction(action.value)}
                disabled={loading}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    gap: "0.125rem",
                  }}
                >
                  <span style={{ fontWeight: 600 }}>{action.label}</span>
                  {action.description && (
                    <span
                      style={{
                        fontSize: "0.75rem",
                        opacity: 0.85,
                        fontWeight: 400,
                      }}
                    >
                      {action.description}
                    </span>
                  )}
                </div>
              </button>
            ))}

            <button
              type="button"
              className="btn btn-secondary btn-block"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDeleteModal;
