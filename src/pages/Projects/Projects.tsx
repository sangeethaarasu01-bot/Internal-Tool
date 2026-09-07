import { Folder, MoreVertical, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { MOCK_PROJECTS } from "../../data/mockProjects";

export const Projects = () => {
  const navigate = useNavigate();

  return (
    <div className="projects-page">
      <div className="projects-page-header">
        <h1>Projects</h1>
        <button
          type="button"
          className="projects-btn-primary"
          onClick={() => navigate("/projects/new")}
        >
          <Plus size={16} />
          Create New Project
        </button>
      </div>

      <div className="projects-grid">
        {MOCK_PROJECTS.map((project) => (
          <article
            key={project.id}
            className="project-card"
            role={project.route ? "button" : undefined}
            tabIndex={project.route ? 0 : undefined}
            onClick={() => project.route && navigate(project.route)}
            onKeyDown={(e) => {
              if (project.route && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault();
                navigate(project.route);
              }
            }}
          >
            <div className="project-card-top">
              <div className="project-card-title-row">
                <span className="project-folder-icon">
                  <Folder size={16} />
                </span>
                <h2>{project.title}</h2>
                <button
                  type="button"
                  className="project-card-menu"
                  aria-label="Project options"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical size={16} />
                </button>
              </div>
              <p>{project.stories} user stories</p>
            </div>

            <div className="project-card-progress">
              <div className="project-progress-track">
                <div
                  className="project-progress-fill"
                  style={{ width: `${project.progress}%` }}
                />
              </div>
              <div className="project-progress-meta">
                <span>{project.progress}% completed</span>
                <span
                  className={`project-status-badge ${project.status === "P" ? "priority" : "success"}`}
                >
                  {project.status}
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};
