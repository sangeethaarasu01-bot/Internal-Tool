import { Outlet } from "react-router-dom";
import { ProjectsSidebar } from "./ProjectsSidebar";
import { ProjectsTopbar } from "./ProjectsTopbar";
import "../../pages/Projects/projects.css";

export const ProjectsLayout = () => {
  return (
    <div className="projects-shell">
      <ProjectsSidebar />
      <div className="projects-main-wrap">
        <ProjectsTopbar />
        <main className="projects-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
