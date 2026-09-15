import { Home, History, ScanText } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSidebar } from "../../context/SidebarContext";

export const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { close } = useSidebar();

  const navItems = [
    { icon: ScanText, label: "Extract", path: "/extract" },
    { icon: Home, label: "Legacy XML", path: "/home" },
    { icon: History, label: "Conv. History", path: "/conversions" },
  ];

  return (
    <nav className="navigation">
      {navItems.map((item) => (
        <button
          type="button"
          key={item.label}
          className={`nav-item ${location.pathname === item.path ? "active" : ""}`}
          onClick={() => {
            navigate(item.path);
            close();
          }}
        >
          <item.icon size={20} />
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
};
