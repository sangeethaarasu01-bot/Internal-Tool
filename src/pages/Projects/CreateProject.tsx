import { UploadCloud } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CreatingProjectModal } from "../../components/ProjectsLayout/CreatingProjectModal";

export const CreateProject = () => {
  const navigate = useNavigate();
  const [projectName, setProjectName] = useState("");
  const [projectPrompt, setProjectPrompt] = useState("");
  const [showCreatingModal, setShowCreatingModal] = useState(false);

  const canContinue = projectName.trim().length > 0;

  const handleConfirm = () => {
    if (!canContinue) return;
    setShowCreatingModal(true);
  };

  return (
    <div className="create-project-page">
      <CreatingProjectModal
        open={showCreatingModal}
        onClose={() => setShowCreatingModal(false)}
      />

      <div className="create-project-header">
        <h1>Create new project</h1>
        <div className="create-project-actions">
          <button
            type="button"
            className="projects-btn-secondary"
            onClick={() => navigate("/projects")}
          >
            Close
          </button>
          <button
            type="button"
            className="projects-btn-primary"
            disabled={!canContinue}
            onClick={handleConfirm}
          >
            Next: Confirm User Stories
          </button>
        </div>
      </div>

      <div className="create-project-body">
        <section className="create-project-form">
          <label className="projects-field">
            <span>Project name</span>
            <input
              type="text"
              placeholder="Give your project a name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
            />
          </label>

          <label className="projects-field">
            <span>Upload relevant documents</span>
            <div className="projects-upload-zone">
              <UploadCloud size={22} />
              <p>
                Drag and drop or <button type="button">Upload Files</button>
              </p>
            </div>
          </label>

          <label className="projects-field">
            <span>Project prompt</span>
            <textarea
              rows={6}
              placeholder="What is this project about? Eg., Implementing CPQ for new subscription product line."
              value={projectPrompt}
              onChange={(e) => setProjectPrompt(e.target.value)}
            />
          </label>
        </section>

        <aside className="create-project-aside">
          <div className="create-aside-card jira-card">
            <div className="jira-card-head">
              <span className="jira-logo">Jira</span>
              <span className="jira-new">NEW</span>
            </div>
            <p>
              Pull in epics and tasks from Jira to kickstart your project with
              real context.
            </p>
            <button type="button" className="projects-btn-primary full">
              Connect Jira
            </button>
          </div>

          <div className="create-aside-card info-card">
            <div className="info-illustration" aria-hidden="true">
              <div className="illus-folder illus-folder-back">Project</div>
              <div className="illus-folder illus-folder-front">Project</div>
              <div className="illus-note note-1">Quote Discount rules</div>
              <div className="illus-note note-2">Auto-Owner Assignment</div>
            </div>
            <h3>When to use projects?</h3>
            <ul>
              <li>Create project for managing multiple user stories.</li>
              <li>
                Lets you add as much context as possible for building better
                solutions.
              </li>
              <li>Collaborate with others and get things done faster.</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
};
