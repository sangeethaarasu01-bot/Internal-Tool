import { Home, History } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

export const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: History, label: "Conversions", path: "/conversions" },
  ];

  return (
    <nav className="navigation">
      {navItems.map((item) => (
        <a
          key={item.label}
          className={`nav-item ${location.pathname === item.path ? "active" : ""}`}
          onClick={() => navigate(item.path)}
          style={{ cursor: "pointer" }}
        >
          <item.icon size={20} />
          <span>{item.label}</span>
        </a>
      ))}
    </nav>
  );
};
