// import { useState } from "react";
import { ConvertButton } from "./ConvertButton";
// import { ConversionStatus } from "./ConversionStatus";
// import { FileCode2 } from "lucide-react";

interface ConversionCardProps {
  onConvert: () => void;
  isConverting?: boolean;
  disabled?: boolean;
}

export const ConversionCard = ({
  onConvert,
  isConverting = false,
  disabled = false,
}: ConversionCardProps) => {
  return (
    <section className="card conversion-card">
      <div className="conversion-content">
        <h2>Convert to IEEE XML</h2>

        <p>Click the button below to start the conversion process.</p>

        <ConvertButton
          onClick={onConvert}
          isLoading={isConverting}
          disabled={disabled}
        />
      </div>
    </section>
  );
};
