import { CheckCircle2, Loader2, XCircle, FileCode2 } from "lucide-react";

type StatusType = "idle" | "uploading" | "converting" | "success" | "error";

interface ConversionStatusProps {
  status: StatusType;
  message?: string;
}

export const ConversionStatus = ({
  status,
  message,
}: ConversionStatusProps) => {
  const getStatusIcon = () => {
    switch (status) {
      case "uploading":
        return <Loader2 size={25} className="spin text-blue-500" />;
      case "converting":
        return <Loader2 size={25} className="spin text-purple-500" />;
      case "success":
        return <CheckCircle2 size={25} className="text-green-500" />;
      case "error":
        return <XCircle size={25} className="text-red-500" />;
      default:
        return <FileCode2 size={25} className="text-gray-400" />;
    }
  };

  const getStatusTitle = () => {
    switch (status) {
      case "uploading":
        return "Uploading...";
      case "converting":
        return "Converting...";
      case "success":
        return "Conversion Successful! ✨";
      case "error":
        return "Conversion Failed";
      default:
        return "Ready to convert";
    }
  };

  const getStatusClass = () => {
    switch (status) {
      case "uploading":
        return "uploading";
      case "converting":
        return "converting";
      case "success":
        return "success";
      case "error":
        return "error";
      default:
        return "idle";
    }
  };

  return (
    <div className="status-container">
      <h3>Conversion Status</h3>

      <div className={`status ${getStatusClass()}`}>
        {getStatusIcon()}

        <div>
          <strong>{getStatusTitle()}</strong>
          <p>{message || "Your file is ready. Click convert to start."}</p>
        </div>
      </div>
    </div>
  );
};
