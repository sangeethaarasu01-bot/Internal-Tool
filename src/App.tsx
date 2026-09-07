import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { Login } from "./pages/Login/Login";
import { Home } from "./pages/Home";
import { Conversions } from "./pages/Conversions";
import { Projects } from "./pages/Projects/Projects";
import { CreateProject } from "./pages/Projects/CreateProject";
import "./App.css";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AppLayout } from "./components/Layout/AppLayout";
import { ProjectsLayout } from "./components/ProjectsLayout/ProjectsLayout";

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route
            element={
              <ProtectedRoute>
                <ProjectsLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/new" element={<CreateProject />} />
          </Route>
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/home" element={<Home />} />
            <Route path="/conversions" element={<Conversions />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
