import { FileCode2, Loader2 } from "lucide-react";

interface ConvertButtonProps {
  onClick: () => void;
  disabled?: boolean;
  isLoading?: boolean;
}

export const ConvertButton = ({
  onClick,
  disabled = false,
  isLoading = false,
}: ConvertButtonProps) => {
  return (
    <button
      className={`convert-button ${isLoading ? "loading" : ""}`}
      onClick={onClick}
      disabled={disabled || isLoading}
    >
      {isLoading ? (
        <>
          <Loader2 size={18} className="spin" />
          Converting...
        </>
      ) : (
        <>
          <FileCode2 size={18} />
          Convert Now
        </>
      )}
    </button>
  );
};
