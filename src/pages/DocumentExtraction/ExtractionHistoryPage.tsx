import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Footer } from "../../components/Layout/Footer";
import { getExtraction, getExtractionText } from "../../services/api";
import {
  loadExtractionHistory,
  type ExtractionHistoryEntry,
} from "../../utils/extractionHistory";

export const ExtractionHistoryPage = () => {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<ExtractionHistoryEntry[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setEntries(loadExtractionHistory());
  }, []);

  const handleOpen = async (entry: ExtractionHistoryEntry) => {
    setLoadingId(entry.extraction_id);
    setError(null);
    try {
      const record = await getExtraction(entry.extraction_id);
      if (record.status !== "completed") {
        throw new Error(`Extraction status: ${record.status}`);
      }
      await getExtractionText(entry.extraction_id);
      navigate("/documents", {
        state: { reopenExtractionId: entry.extraction_id },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load extraction");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <>
      <header className="page-header">
        <div>
          <h1>
            Extraction <span>History</span>
          </h1>
          <p>Recent Stage 1 extractions from this browser session.</p>
        </div>
      </header>

      <section className="card extraction-result-card">
        {error ? <p className="history-error">{error}</p> : null}
        {entries.length === 0 ? (
          <p>No extractions yet. Run Document Extraction to populate history.</p>
        ) : (
          <ul className="history-list">
            {entries.map((entry) => (
              <li key={entry.extraction_id} className="history-list__item">
                <div>
                  <strong>{entry.filename}</strong>
                  <span>
                    {entry.page_count ?? "—"} pages · {entry.status} ·{" "}
                    {new Date(entry.created_at).toLocaleString()}
                  </span>
                </div>
                <button
                  type="button"
                  className="browse-button"
                  disabled={loadingId === entry.extraction_id}
                  onClick={() => handleOpen(entry)}
                >
                  {loadingId === entry.extraction_id ? "Loading..." : "View"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
      <Footer />
    </>
  );
};
