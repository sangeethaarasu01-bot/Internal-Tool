import {
  Upload,
  Sparkles,
  Code2,
  ArrowDownToLine,
  CheckCircle2,
  Loader2,
  type LucideIcon,
} from "lucide-react";

interface Step {
  icon: LucideIcon;
  title: string;
  description: string;
  status: "pending" | "active" | "completed";
}

interface StepsCardProps {
  currentStep?: number; // 0-3
}

interface StatusInfo {
  icon: LucideIcon | null;
  className: string;
  label: string;
}

export const StepsCard = ({ currentStep = -1 }: StepsCardProps) => {
  const steps: Step[] = [
    {
      icon: Upload,
      title: "Upload PDF",
      description: "Upload your IEEE formatted PDF file.",
      status:
        currentStep === 0
          ? "active"
          : currentStep > 0
            ? "completed"
            : "pending",
    },
    {
      icon: Sparkles,
      title: "AI Processing",
      description: "Our AI extracts and structures the content.",
      status:
        currentStep === 1
          ? "active"
          : currentStep > 1
            ? "completed"
            : "pending",
    },
    {
      icon: Code2,
      title: "Generate XML",
      description: "Convert content to IEEE XML format.",
      status:
        currentStep === 2
          ? "active"
          : currentStep > 2
            ? "completed"
            : "pending",
    },
    {
      icon: ArrowDownToLine,
      title: "Download",
      description: "Download the converted IEEE XML file.",
      status:
        currentStep === 3
          ? "active"
          : currentStep > 3
            ? "completed"
            : "pending",
    },
  ];

  const getStepStatus = (status: string): StatusInfo => {
    switch (status) {
      case "completed":
        return {
          icon: CheckCircle2,
          className: "completed",
          label: "Done ✓",
        };
      case "active":
        return {
          icon: Loader2,
          className: "active",
          label: "In Progress...",
        };
      default:
        return {
          icon: null,
          className: "pending",
          label: "",
        };
    }
  };

  return (
    <section className="card steps-card">
      {steps.map((step, index) => {
        const statusInfo = getStepStatus(step.status);
        const Icon = step.icon;
        const StatusIcon = statusInfo.icon;

        return (
          <div key={index} className={`step ${statusInfo.className}`}>
            <div className="step-icon-wrapper">
              <div className="step-icon">
                <Icon size={23} />
              </div>
              {/* ✅ Fixed: Only render if StatusIcon exists */}
              {StatusIcon && (
                <div className="step-status-icon">
                  <StatusIcon size={16} />
                </div>
              )}
            </div>

            <div>
              <div className="step-header">
                <h3>
                  {index + 1}. {step.title}
                </h3>
                {statusInfo.label && (
                  <span className={`step-badge ${statusInfo.className}`}>
                    {statusInfo.label}
                  </span>
                )}
              </div>
              <p>{step.description}</p>
            </div>
          </div>
        );
      })}
    </section>
  );
};
