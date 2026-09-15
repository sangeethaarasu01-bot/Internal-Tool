import { FileText, ScanText, History, Settings } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { Brand } from "../Sidebar/Brand";
import { Profile } from "../Sidebar/Profile";
import { useSidebar } from "../../context/SidebarContext";

const NAV_ITEMS = [
  { icon: FileText, label: "Documents", path: "/documents" },
  { icon: ScanText, label: "Extractions", path: "/extractions" },
  { icon: History, label: "History", path: "/history" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

export const ExtractionSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isOpen, close } = useSidebar();

  return (
    <aside className={`sidebar ${isOpen ? "open" : ""}`}>
      <Brand />
      <nav className="navigation sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <button
            type="button"
            key={item.path}
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
      <div className="sidebar-bottom">
        <Profile />
      </div>
    </aside>
  );
};
