import { ChevronDown, Cloud, Search, Tag } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export const ProjectsTopbar = () => {
  const { user } = useAuth();

  return (
    <header className="projects-topbar">
      <button type="button" className="projects-org-select">
        <span className="projects-org-icon">
          <Cloud size={16} />
        </span>
        <span className="projects-org-label">IEEE Publishing Workspace</span>
        <ChevronDown size={16} />
      </button>

      <div className="projects-topbar-right">
        <div className="projects-search">
          <Search size={16} />
          <input type="search" placeholder="AI Search" aria-label="AI Search" />
          <kbd>⌘K</kbd>
        </div>

        <button type="button" className="projects-workspace-pill">
          <Tag size={14} />
          {user?.name ? `${user.name}'s Workspace` : "Workspace"}
        </button>

        <div className="projects-avatar" title={user?.email}>
          {user?.name?.charAt(0) ?? "U"}
        </div>
      </div>
    </header>
  );
};
