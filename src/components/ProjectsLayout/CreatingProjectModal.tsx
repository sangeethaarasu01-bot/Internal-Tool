import { Check, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const STEPS = [
  "Creating project",
  "Processing files",
  "Indexing files",
  "Creating project knowledge base",
] as const;

type StepStatus = "pending" | "active" | "done";

interface CreatingProjectModalProps {
  open: boolean;
  onClose: () => void;
}

export const CreatingProjectModal = ({
  open,
  onClose,
}: CreatingProjectModalProps) => {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(1);
  const [doneCount, setDoneCount] = useState(1);

  useEffect(() => {
    if (!open) {
      setActiveIndex(1);
      setDoneCount(1);
      return;
    }

    setActiveIndex(1);
    setDoneCount(1);

    const timers: number[] = [];

    for (let index = 2; index <= STEPS.length; index += 1) {
      timers.push(
        window.setTimeout(() => {
          setActiveIndex(index);
          setDoneCount(index);
        }, (index - 1) * 1400),
      );
    }

    timers.push(
      window.setTimeout(() => {
        onClose();
        navigate("/projects", { replace: true });
      }, STEPS.length * 1400 + 600),
    );

    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [open, navigate, onClose]);

  if (!open) return null;

  const getStatus = (index: number): StepStatus => {
    if (index < doneCount) return "done";
    if (index === activeIndex && doneCount < STEPS.length) return "active";
    return "pending";
  };

  return (
    <div className="creating-project-overlay" role="dialog" aria-modal="true">
      <div className="creating-project-modal">
        <h2>Creating your project</h2>
        <p>This may take a few moments. Please don&apos;t close this page.</p>

        <ul className="creating-project-steps">
          {STEPS.map((label, index) => {
            const status = getStatus(index);
            return (
              <li
                key={label}
                className={`creating-step creating-step-${status}`}
              >
                <span className="creating-step-icon" aria-hidden="true">
                  {status === "done" ? (
                    <Check size={14} strokeWidth={3} />
                  ) : status === "active" ? (
                    <span className="creating-step-dot active" />
                  ) : (
                    <span className="creating-step-dot" />
                  )}
                </span>
                <span className="creating-step-label">{label}</span>
                {status === "active" && (
                  <Loader2
                    size={18}
                    className="creating-step-spinner"
                    aria-label="In progress"
                  />
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};
