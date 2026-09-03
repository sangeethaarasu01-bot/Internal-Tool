import { useState } from "react";
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

// Types
interface Conversion {
  id: number;
  filename: string;
  date: string;
  size: string;
  status: "success" | "failed" | "processing";
  xmlContent?: string;
}

export const Conversions = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "success" | "failed" | "processing"
  >("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Mock data - In real app, fetch from API
  const conversions: Conversion[] = [
    {
      id: 1,
      filename: "ieee_paper_2024.pdf",
      date: "02 Sep 2026, 10:30 AM",
      size: "1.45 MB",
      status: "success",
      xmlContent: "<ieee-article>...</ieee-article>",
    },
    {
      id: 2,
      filename: "research_article_final.pdf",
      date: "01 Sep 2026, 03:15 PM",
      size: "2.10 MB",
      status: "success",
      xmlContent: "<ieee-article>...</ieee-article>",
    },
    {
      id: 3,
      filename: "conference_paper_draft.pdf",
      date: "31 Aug 2026, 11:20 AM",
      size: "0.80 MB",
      status: "failed",
    },
    {
      id: 4,
      filename: "journal_submission_2026.pdf",
      date: "30 Aug 2026, 09:45 AM",
      size: "3.20 MB",
      status: "processing",
    },
    {
      id: 5,
      filename: "paper_version_2.pdf",
      date: "29 Aug 2026, 02:00 PM",
      size: "1.20 MB",
      status: "success",
      xmlContent: "<ieee-article>...</ieee-article>",
    },
    {
      id: 6,
      filename: "ieee_transactions.pdf",
      date: "28 Aug 2026, 04:30 PM",
      size: "2.80 MB",
      status: "success",
      xmlContent: "<ieee-article>...</ieee-article>",
    },
    {
      id: 7,
      filename: "draft_paper.pdf",
      date: "27 Aug 2026, 01:15 PM",
      size: "0.95 MB",
      status: "failed",
    },
  ];

  // Filter and search
  const filteredConversions = conversions.filter((item) => {
    const matchesSearch = item.filename
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterStatus === "all" || item.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  // Pagination
  const totalPages = Math.ceil(filteredConversions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = filteredConversions.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  // Status badge component
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return (
          <span className="badge success">
            <CheckCircle2 size={14} />
            Done
          </span>
        );
      case "failed":
        return (
          <span className="badge error">
            <XCircle size={14} />
            Failed
          </span>
        );
      case "processing":
        return (
          <span className="badge processing">
            <Clock size={14} className="spin" />
            Processing
          </span>
        );
      default:
        return null;
    }
  };

  // Download handler
  const handleDownload = (conversion: Conversion) => {
    if (conversion.status === "success" && conversion.xmlContent) {
      const blob = new Blob([conversion.xmlContent], {
        type: "application/xml",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = conversion.filename.replace(".pdf", ".xml");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      alert("No XML content available for this conversion");
    }
  };

  // Retry handler
  const handleRetry = (conversion: Conversion) => {
    alert(`Retrying conversion for: ${conversion.filename}`);
    // In real app, this would re-upload and convert
  };

  // Stats
  const stats = {
    total: conversions.length,
    success: conversions.filter((c) => c.status === "success").length,
    failed: conversions.filter((c) => c.status === "failed").length,
    processing: conversions.filter((c) => c.status === "processing").length,
  };

  return (
    <div className="conversions-page">
      <div className="conversions-header">
        <div>
          <h1>📊 Conversion History</h1>
          <p>View and download your past IEEE XML conversions</p>
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

      {/* Filters */}
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
            ✅ Done
          </button>
          <button
            className={`filter-btn error ${filterStatus === "failed" ? "active" : ""}`}
            onClick={() => setFilterStatus("failed")}
          >
            ❌ Failed
          </button>
          <button
            className={`filter-btn processing ${filterStatus === "processing" ? "active" : ""}`}
            onClick={() => setFilterStatus("processing")}
          >
            ⏳ Processing
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="conversions-table-container">
        {filteredConversions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📄</div>
            <p>No conversions found</p>
            <span>Try adjusting your search or filters</span>
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
                  <span className="col-date">{item.date}</span>
                  <span className="col-size">{item.size}</span>
                  <span className="col-status">
                    {getStatusBadge(item.status)}
                  </span>
                  <span className="col-actions">
                    {item.status === "success" && (
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
                    {item.status === "processing" && (
                      <span className="processing-text">
                        <Clock size={14} className="spin" />
                        Waiting...
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>

            {/* Pagination */}
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

            {/* Footer Info */}
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
