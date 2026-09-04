import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FileText,
  Download,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  downloadXmlFile,
  getConversion,
  getConversionStats,
  listConversions,
  retryConversion,
  type ConversionRecord,
  type ConversionStats,
  isConversionDone,
} from "../services/api";

const emptyStats: ConversionStats = {
  total: 0,
  success: 0,
  failed: 0,
  processing: 0,
};

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatSize = (mb?: number) => {
  if (mb == null) return "—";
  if (mb < 0.01) return `${Math.round(mb * 1024)} KB`;
  return `${mb.toFixed(2)} MB`;
};

export const Conversions = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "success" | "failed" | "processing"
  >("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [conversions, setConversions] = useState<ConversionRecord[]>([]);
  const [stats, setStats] = useState<ConversionStats>(emptyStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const itemsPerPage = 5;

  const loadData = useCallback(async () => {
    const [items, nextStats] = await Promise.all([
      listConversions(),
      getConversionStats(),
    ]);
    setConversions(items);
    setStats(nextStats);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        await loadData();
        setError(null);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load conversions");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadData]);

  useEffect(() => {
    const hasActive = conversions.some(
      (c) => c.status === "processing" || c.status === "pending",
    );
    if (!hasActive) return undefined;
    const timer = window.setInterval(() => {
      loadData().catch(() => undefined);
    }, 2000);
    return () => window.clearInterval(timer);
  }, [conversions, loadData]);

  const filteredConversions = useMemo(() => {
    return conversions.filter((item) => {
      const name = item.filename || item.original_filename || "";
      const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase());
      const uiStatus = isConversionDone(item.status)
        ? "success"
        : item.status === "pending"
          ? "processing"
          : item.status;
      const matchesFilter =
        filterStatus === "all" || uiStatus === filterStatus;
      return matchesSearch && matchesFilter;
    });
  }, [conversions, searchTerm, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(filteredConversions.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = filteredConversions.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus]);

  const getStatusBadge = (status: string) => {
    if (isConversionDone(status)) {
      return (
        <span className="badge success">
          <CheckCircle2 size={14} />
          Done
        </span>
      );
    }
    if (status === "failed") {
      return (
        <span className="badge error">
          <XCircle size={14} />
          Failed
        </span>
      );
    }
    return (
      <span className="badge processing">
        <Clock size={14} className="spin" />
        Processing
      </span>
    );
  };

  const handleDownload = async (conversion: ConversionRecord) => {
    try {
      const full = conversion.xml_content
        ? conversion
        : await getConversion(conversion.id);
      if (!full.xml_content) {
        window.alert("No XML content available for this conversion");
        return;
      }
      downloadXmlFile(full.filename, full.xml_content);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Download failed");
    }
  };

  const handleRetry = async (conversion: ConversionRecord) => {
    try {
      await retryConversion(conversion.id);
      await loadData();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Retry failed");
    }
  };

  return (
    <div className="conversions-page">
      <div className="conversions-header">
        <div>
          <h1>Conversion History</h1>
          <p>View and download IEEE JATS XML conversions from MongoDB</p>
        </div>
        <div className="header-stats">
          <div className="stat-item">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Total</span>
          </div>
          <div className="stat-item success">
            <span className="stat-value">{stats.success}</span>
            <span className="stat-label">Success</span>
          </div>
          <div className="stat-item failed">
            <span className="stat-value">{stats.failed}</span>
            <span className="stat-label">Failed</span>
          </div>
          <div className="stat-item processing">
            <span className="stat-value">{stats.processing}</span>
            <span className="stat-label">Processing</span>
          </div>
        </div>
      </div>

      <div className="conversions-filters">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search by filename..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-buttons">
          <button
            className={`filter-btn ${filterStatus === "all" ? "active" : ""}`}
            onClick={() => setFilterStatus("all")}
          >
            All
          </button>
          <button
            className={`filter-btn success ${filterStatus === "success" ? "active" : ""}`}
            onClick={() => setFilterStatus("success")}
          >
            Done
          </button>
          <button
            className={`filter-btn error ${filterStatus === "failed" ? "active" : ""}`}
            onClick={() => setFilterStatus("failed")}
          >
            Failed
          </button>
          <button
            className={`filter-btn processing ${filterStatus === "processing" ? "active" : ""}`}
            onClick={() => setFilterStatus("processing")}
          >
            Processing
          </button>
        </div>
      </div>

      <div className="conversions-table-container">
        {loading ? (
          <div className="empty-state">
            <div className="empty-icon">⏳</div>
            <p>Loading conversions...</p>
          </div>
        ) : error ? (
          <div className="empty-state">
            <div className="empty-icon">⚠️</div>
            <p>{error}</p>
            <span>Start the Python API and MongoDB, then refresh.</span>
          </div>
        ) : filteredConversions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📄</div>
            <p>No conversions found</p>
            <span>Select a PDF on Home, then click Convert</span>
          </div>
        ) : (
          <>
            <div className="conversion-table">
              <div className="table-header">
                <span className="col-sno">#</span>
                <span className="col-file">File Name</span>
                <span className="col-date">Date</span>
                <span className="col-size">Size</span>
                <span className="col-status">Status</span>
                <span className="col-actions">Actions</span>
              </div>

              {paginatedItems.map((item, index) => (
                <div key={item.id} className="table-row">
                  <span className="col-sno">{startIndex + index + 1}</span>
                  <span className="col-file">
                    <FileText size={16} />
                    <span className="filename">{item.filename}</span>
                  </span>
                  <span className="col-date">{formatDate(item.created_at)}</span>
                  <span className="col-size">{formatSize(item.file_size)}</span>
                  <span className="col-status">
                    {getStatusBadge(
                      isConversionDone(item.status)
                        ? "completed"
                        : item.status === "pending"
                          ? "processing"
                          : item.status,
                    )}
                  </span>
                  <span className="col-actions">
                    {isConversionDone(item.status) && (
                      <button
                        className="action-btn download"
                        onClick={() => handleDownload(item)}
                        title="Download XML"
                      >
                        <Download size={16} />
                      </button>
                    )}
                    {item.status === "failed" && (
                      <button
                        className="action-btn retry"
                        onClick={() => handleRetry(item)}
                        title="Retry Conversion"
                      >
                        <RotateCcw size={16} />
                      </button>
                    )}
                    {(item.status === "processing" || item.status === "pending") && (
                      <span className="processing-text">
                        <Clock size={14} className="spin" />
                        Waiting...
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                <button
                  className="page-btn"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => prev - 1)}
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>
                <div className="page-numbers">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <button
                        key={page}
                        className={`page-number ${currentPage === page ? "active" : ""}`}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </button>
                    ),
                  )}
                </div>
                <button
                  className="page-btn"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((prev) => prev + 1)}
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            )}

            <div className="table-footer">
              Showing {startIndex + 1} -{" "}
              {Math.min(startIndex + itemsPerPage, filteredConversions.length)}{" "}
              of {filteredConversions.length} conversions
            </div>
          </>
        )}
      </div>
    </div>
  );
};
