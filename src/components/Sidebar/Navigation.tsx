import { Home, History } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSidebar } from "../../context/SidebarContext";

export const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { close } = useSidebar();

  const navItems = [
    { icon: Home, label: "Home", path: "/home" },
    { icon: History, label: "Conversions", path: "/conversions" },
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
