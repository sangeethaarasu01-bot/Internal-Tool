import {
  BookOpen,
  FolderKanban,
  HelpCircle,
  MessageSquare,
  Settings,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const navItems = [
  { icon: MessageSquare, label: "AI Chat", path: "/projects" },
  { icon: FolderKanban, label: "Projects", path: "/projects" },
  { icon: BookOpen, label: "Documentation", path: "/home" },
  { icon: Settings, label: "Workspace Settings", path: "/projects" },
];

export const ProjectsSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string, label: string) => {
    if (label === "Projects") {
      return location.pathname === "/projects" || location.pathname.startsWith("/projects/");
    }
    return location.pathname === path;
  };

  return (
    <aside className="projects-sidebar">
      <div className="projects-sidebar-logo" aria-hidden="true">
        <span>A</span>
      </div>

      <nav className="projects-sidebar-nav">
        {navItems.map((item) => (
          <button
            key={item.label}
            type="button"
            className={`projects-sidebar-item ${isActive(item.path, item.label) ? "active" : ""}`}
            onClick={() => navigate(item.path)}
            title={item.label}
          >
            <item.icon size={20} strokeWidth={1.75} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <button type="button" className="projects-sidebar-help" title="Get Help">
        <HelpCircle size={18} strokeWidth={1.75} />
        <span>Get Help</span>
      </button>
    </aside>
  );
};
