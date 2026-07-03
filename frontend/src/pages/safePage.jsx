import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar.jsx";
import MobileHeader from "../components/MobileHeader.jsx";
import SafeTable from "../components/SafeTable.jsx";
import PaginationComponent from "../components/PaginationComponent.jsx";
import { getProfile } from "../services/users.js";
import { fetchSafeRecords } from "../services/safeService.js";

export default function SafePage() {
  const [records, setRecords] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const LIMIT = 10;
  const [currentPage, setCurrentPage] = useState(1);

  const loadRecords = async (page = 1) => {
    try {
      setLoading(true);
      const profile = (await getProfile())?.[0];
      const orgId = profile?.organization_id;
      if (!orgId) {
        setRecords([]);
        setTotal(0);
        return;
      }
      const res = await fetchSafeRecords(orgId, page, LIMIT);
      setRecords(res.data || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error("Error loading safe records:", err);
      setRecords([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords(currentPage);
  }, [currentPage]);

  return (
    <div className="page">
      <Sidebar activeView="safe" isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main className="page-main">
        <MobileHeader eyebrow="Panel" title="Caja" onMenuClick={() => setIsSidebarOpen(true)} />

        <div className="page-header">
          <div>
            <p className="page-header-eyebrow">Panel</p>
            <h1 className="page-title">Caja</h1>
          </div>
        </div>

        <section className="page-section">
          <SafeTable records={records} loading={loading} />
        </section>

        <div style={{ display: "flex", justifyContent: "center", marginTop: "1rem" }}>
          <PaginationComponent totalPages={Math.ceil(total / LIMIT)} currentPage={currentPage} onChangePage={setCurrentPage} />
        </div>
      </main>
    </div>
  );
}
