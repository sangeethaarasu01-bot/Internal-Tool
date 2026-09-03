import { Brand } from "./Brand";
import { Navigation } from "./Navigation";
// import { ThemeSwitch } from "./ThemeSwitch";
import { Profile } from "./Profile";

export const Sidebar = () => {
  return (
    <aside className="sidebar">
      <Brand />
      <Navigation />

      <div className="sidebar-bottom">
        {/* <ThemeSwitch /> */}
        <Profile name="Sangeetha" email="sangeetha@gmail.com" />
      </div>
    </aside>
  );
};
