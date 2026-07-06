import { useEffect, useState } from "react";
import { fetchInvoices, issueInvoicesFromGoogleSheets, markInvoicesAsBilled } from "../services/api.js";
import Sidebar from "../components/Sidebar.jsx";
import MobileHeader from "../components/MobileHeader.jsx";
import BillingsTable from "./../components/BillingsTable.jsx";
import PaginationComponent from "../components/PaginationComponent.jsx";

const normalizeInvoiceStatus = (value) => {
  const raw = String(value ?? "").trim().toUpperCase();
  if (["OK", "FACTURADO", "FACTURADA", "APROBADO"].includes(raw)) {
    return "OK";
  }
  if (["PENDING", "PENDIENTE"].includes(raw)) {
    return "PENDING";
  }
  return raw || "PENDING";
};

const getArcaValue = (response, keys = []) => {
  if (!response) return "-";
  const candidates = [];
  for (const key of keys) {
    candidates.push(response?.[key]);
    candidates.push(response?.result?.[key]);
    candidates.push(response?.data?.[key]);
  }
  for (const value of candidates) {
    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }
  return "-";
};

export default function BillingsPage() {
  const [invoices, setInvoices] = useState([]);
  const [totalInvoices, setTotalInvoices] = useState(0);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const LIMIT = 10;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [sheetUrl, setSheetUrl] = useState("");
  const [invoicePreview, setInvoicePreview] = useState(null);
  const [invoiceError, setInvoiceError] = useState("");
  const [invoiceSuccess, setInvoiceSuccess] = useState("");
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [arcaResponses, setArcaResponses] = useState([]);

  const billingsTableColumns = [
    { label: "Fecha", key: "created_at" },
    { label: "Monto", key: "price" },
    { label: "Estado", key: "status" },
  ];

  const loadInvoices = async (page) => {
    try {
      setLoading(true);
      const res = await fetchInvoices(page, LIMIT);
      setInvoices(res.data ?? []);
      setTotalInvoices(res.total ?? 0);
    } catch (err) {
      console.error("Error cargando facturas:", err);
      setInvoices([]);
      setTotalInvoices(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices(currentPage);
  }, [currentPage]);

  const resetInvoiceModal = () => {
    setSheetUrl("");
    setInvoicePreview(null);
    setInvoiceError("");
    setInvoiceSuccess("");
    setInvoiceLoading(false);
    setArcaResponses([]);
  };

  const handleOpenInvoiceModal = () => {
    resetInvoiceModal();
    setIsInvoiceModalOpen(true);
  };

  const handleInvoiceSubmit = async (event) => {
    event.preventDefault();

    try {
      setInvoiceLoading(true);
      setInvoiceError("");
      setInvoiceSuccess("");

      if (!sheetUrl.trim()) {
        const pendingRows = (invoices || [])
          .filter((invoice) => normalizeInvoiceStatus(invoice.estadoFactura || invoice.status) === "PENDING")
          .map((invoice) => ({
            facturaId: invoice.facturaId || invoice.id || invoice.factura_id,
            id: invoice.id,
            fecha: invoice.created_at || invoice.fecha || invoice.date,
            producto: invoice.producto || invoice.description || invoice.nombre || invoice.facturaId || invoice.id,
            precio: invoice.price || invoice.montoTotal || invoice.amount || 0,
            estadoFactura: invoice.estadoFactura || invoice.status || "PENDING",
            columns: billingsTableColumns,
          }));

        if (!pendingRows.length) {
          setInvoiceError("No hay facturas PENDING para actualizar.");
          return;
        }

        const result = await markInvoicesAsBilled(pendingRows, "OK");
        const updatedCount = result?.updatedCount ?? pendingRows.length;
        setArcaResponses(
          pendingRows.map((invoice) => ({
            producto: invoice.producto,
            response: {
              status: "OK",
              detail: `Actualizada en Supabase para ${invoice.facturaId || invoice.id}`,
            },
          })),
        );
        setInvoiceSuccess(`Se actualizaron ${updatedCount} registro${updatedCount === 1 ? "" : "s"} en Supabase.`);
        await loadInvoices(currentPage);
        return;
      }

      const preview = await issueInvoicesFromGoogleSheets(sheetUrl.trim(), true);
      const count = preview?.count ?? preview?.preview?.productCount ?? 0;
      setInvoicePreview(preview);
      if (!count) {
        setInvoiceError("No se encontraron productos para facturar en esa hoja.");
        return;
      }

      setInvoiceSuccess(`Se encontraron ${count} producto${count === 1 ? "" : "s"} listos para facturar.`);

      const result = await issueInvoicesFromGoogleSheets(sheetUrl.trim(), false);
      const issuedCount = result?.count ?? 0;
      setInvoiceSuccess(`Se facturaron ${issuedCount} producto${issuedCount === 1 ? "" : "s"} correctamente.`);
      setArcaResponses(
        (result?.invoices || []).map((item) => ({
          producto: item.producto,
          response: item.invoiceResult,
        })),
      );
      await loadInvoices(currentPage);
    } catch (err) {
      console.error("Error facturando:", err);
      setInvoiceError(err?.response?.data?.error || "No se pudo completar la facturación.");
    } finally {
      setInvoiceLoading(false);
    }
  };

  return (
    <div className="page">
      <Sidebar
        activeView="facturacion"
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <main className="page-main">
        <MobileHeader
          eyebrow="Panel"
          title="Facturas"
          onMenuClick={() => setIsSidebarOpen(true)}
        />

        <div className="page-header">
          <div>
            <p className="page-header-eyebrow">Panel</p>
            <h1 className="page-title">Facturas</h1>
          </div>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleOpenInvoiceModal}
            >
              Facturar
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => loadInvoices(currentPage)}
              disabled={loading}
            >
              {loading ? "Actualizando..." : "Actualizar lista"}
            </button>
          </div>
        </div>

        <section className="page-section">
          {loading ? (
            <div className="table-state">Cargando facturas...</div>
          ) : (
            <BillingsTable invoices={invoices} />
          )}
        </section>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            marginTop: "1rem",
          }}
        >
          <p>
            Mostrando{" "}
            {totalInvoices === 0
              ? 0
              : (currentPage - 1) * LIMIT + 1}
            {"-"}
            {Math.min(
              currentPage * LIMIT,
              totalInvoices
            )} de {totalInvoices} facturas
          </p>
        </div>

        <div
          style={{ display: "flex", justifyContent: "center", marginTop: "1rem" }}
        >
          <PaginationComponent
            totalPages={Math.ceil(totalInvoices / LIMIT)}
            currentPage={currentPage}
            onChangePage={setCurrentPage}
          />
        </div>
      </main>

      {isInvoiceModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsInvoiceModalOpen(false)}>
          <div className="modal-container modal-lg" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">Facturar desde Google Sheets</h2>
                <p className="modal-subtitle">
                  Pegá la URL del sheet para facturar desde Google Sheets, o dejala vacía para usar solo las facturas con estado PENDING de la tabla actual y actualizar el estado en Supabase.
                </p>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-icon"
                onClick={() => setIsInvoiceModalOpen(false)}
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleInvoiceSubmit}>
              <div className="modal-body" style={{ display: "grid", gap: "1rem" }}>
                <div className="alert alert-info">
                  Las columnas deben venir en este orden: producto, precio, provincia, dni/cuit, dirección, fecha.
                </div>

                {invoiceError && <div className="alert alert-error">{invoiceError}</div>}
                {invoiceSuccess && <div className="alert alert-success">{invoiceSuccess}</div>}

                <div>
                  <label className="label" htmlFor="invoice-sheet-url">
                    URL de Google Sheets
                  </label>
                  <input
                    id="invoice-sheet-url"
                    type="text"
                    className="input"
                    value={sheetUrl}
                    onChange={(event) => {
                      setSheetUrl(event.target.value);
                      setInvoicePreview(null);
                      setInvoiceError("");
                      setInvoiceSuccess("");
                    }}
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                    disabled={invoiceLoading}
                  />
                </div>

                <div className="card" style={{ display: "grid", gap: "0.5rem" }}>
                  <strong style={{ fontSize: "0.95rem" }}>Detalle de facturación</strong>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
                    {invoicePreview?.count || invoicePreview?.preview?.productCount ? (
                      <>Se van a facturar {invoicePreview.count ?? invoicePreview.preview.productCount} productos.</>
                    ) : (
                      <>Ingresá el link para ver la cantidad de productos a facturar.</>
                    )}
                  </span>
                </div>

                {arcaResponses.length > 0 && (
                  <div className="card" style={{ display: "grid", gap: "0.75rem" }}>
                    <strong style={{ fontSize: "0.95rem" }}>Respuesta de ARCA</strong>
                    <div className="table-wrapper">
                      <table className="data-table data-table--inset">
                        <thead>
                          <tr>
                            <th>Producto</th>
                            <th>CAE</th>
                            <th>Estado</th>
                            <th>Detalle</th>
                          </tr>
                        </thead>
                        <tbody>
                          {arcaResponses.map((item, index) => {
                            const cae = getArcaValue(item.response, ["CAE", "cae", "Cae"]);
                            const estado = getArcaValue(item.response, ["status", "Status", "resultado", "Resultado"]);
                            const detalle = JSON.stringify(item.response, null, 2);

                            return (
                              <tr key={`${item.producto}-${index}`}>
                                <td>{item.producto || "-"}</td>
                                <td>{cae}</td>
                                <td>{estado === "-" ? "ok" : estado}</td>
                                <td>
                                  <pre style={{ margin: 0, whiteSpace: "pre-wrap", fontSize: "0.75rem" }}>
                                    {detalle}
                                  </pre>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsInvoiceModalOpen(false)}
                  disabled={invoiceLoading}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={invoiceLoading}>
                  {invoiceLoading ? "Facturando..." : "Facturar productos"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}