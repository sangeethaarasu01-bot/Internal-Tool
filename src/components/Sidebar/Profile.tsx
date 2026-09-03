import { ChevronDown } from "lucide-react";

interface ProfileProps {
  name: string;
  email: string;
}

export const Profile = ({ name, email }: ProfileProps) => {
  return (
    <div className="profile">
      <div className="avatar">{name.charAt(0)}</div>

      <div className="profile-info">
        <strong>{name}</strong>
        <span>{email}</span>
      </div>

      <ChevronDown size={18} />
    </div>
  );
};
