import { Brand } from "./Brand";
import { Navigation } from "./Navigation";
import { Profile } from "./Profile";
import { useSidebar } from "../../context/SidebarContext";

export const Sidebar = () => {
  const { isOpen } = useSidebar();

  return (
    <aside className={`sidebar ${isOpen ? "open" : ""}`}>
      <Brand />
      <Navigation />

      <div className="sidebar-bottom">
        <Profile />
      </div>
    </aside>
  );
};
