import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, LogOut } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  return (
    <div className="profile-wrap">
      <button
        type="button"
        className="profile"
        onClick={() => setMenuOpen((open) => !open)}
        aria-expanded={menuOpen}
      >
        <div className="avatar">{user.name.charAt(0)}</div>

        <div className="profile-info">
          <strong>{user.name}</strong>
          <span>{user.email}</span>
        </div>

        <ChevronDown size={18} className={menuOpen ? "chevron-open" : ""} />
      </button>

      {menuOpen ? (
        <button type="button" className="profile-logout" onClick={handleLogout}>
          <LogOut size={16} />
          Sign out
        </button>
      ) : null}
    </div>
  );
};
