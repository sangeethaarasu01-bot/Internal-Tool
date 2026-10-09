import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import { ExtractionLayout } from "./components/ExtractionLayout/ExtractionLayout";
import ChatAgent from "./pages/ChatAgent";
import { DocumentExtraction } from "./pages/DocumentExtraction/DocumentExtraction";
import HeuristicChatAgent from "./pages/HeuristicChatAgent";

/**
 * Default: AI-style chat UI + heuristic extractions API (no LLM).
 * /documents: full sidebar layout with tabs and detailed preview.
 * /agent: LLM job pipeline (upload + convert).
 */
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HeuristicChatAgent />} />
        <Route path="/documents" element={<ExtractionLayout />}>
          <Route index element={<DocumentExtraction />} />
        </Route>
        <Route path="/extract" element={<Navigate to="/documents" replace />} />
        <Route path="/agent" element={<ChatAgent />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
