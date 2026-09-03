import { Sun, Moon } from "lucide-react";
import { useState } from "react";

export const ThemeSwitch = () => {
  const [isDark, setIsDark] = useState(false);

  return (
    <div className="theme-switch">
      <button
        className={`theme-button ${!isDark ? "active" : ""}`}
        onClick={() => setIsDark(false)}
      >
        <Sun size={17} />
      </button>

      <button
        className={`theme-button ${isDark ? "active" : ""}`}
        onClick={() => setIsDark(true)}
      >
        <Moon size={17} />
      </button>
    </div>
  );
};
