import { AlertTriangle, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

interface LegacyPipelineBannerProps {
  variant?: "warning" | "info";
}

export const LegacyPipelineBanner = ({
  variant = "warning",
}: LegacyPipelineBannerProps) => {
  return (
    <div className={`legacy-pipeline-banner legacy-pipeline-banner--${variant}`}>
      <div className="legacy-pipeline-banner__icon">
        <AlertTriangle size={22} />
      </div>
      <div className="legacy-pipeline-banner__content">
        <strong>Legacy PDF → XML conversion is disabled</strong>
        <p>
          The old hardcoded JATS pipeline has been retired. Use{" "}
          <strong>Document Extraction</strong> for Stage 1 IR (front / body / back),
          then scoped XML generation in Phase 2.
        </p>
        <Link to="/documents" className="legacy-pipeline-banner__link">
          Go to Document Extraction
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
};
