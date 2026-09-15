import { Footer } from "../../components/Layout/Footer";

const API_BASE =
  String(import.meta.env.VITE_API_URL || "").replace(/\/$/, "") ||
  (import.meta.env.PROD
    ? "https://internal-tool-backend-x10p.onrender.com"
    : "(dev proxy → http://127.0.0.1:8000)");

export const ExtractionSettingsPage = () => (
  <>
    <header className="page-header">
      <div>
        <h1>
          Extraction <span>Settings</span>
        </h1>
        <p>Stage 1 integration settings for this environment.</p>
      </div>
    </header>

    <section className="card extraction-result-card">
      <ul className="extraction-overview-list">
        <li>
          <strong>API base:</strong> {API_BASE}
        </li>
        <li>
          <strong>Extraction endpoint:</strong> POST /api/extractions
        </li>
        <li>
          <strong>Status endpoint:</strong> GET /api/extractions/:id
        </li>
        <li>
          <strong>Result endpoint:</strong> GET /api/extractions/:id/text
        </li>
        <li>
          <strong>Upload creates conversion:</strong> No
        </li>
        <li>
          <strong>Stage:</strong> Stage 1 only (no XML generation)
        </li>
      </ul>
    </section>
    <Footer />
  </>
);
