import { Outlet } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Sidebar } from "../Sidebar/Sidebar";
import { SidebarProvider, useSidebar } from "../../context/SidebarContext";

const AppShell = () => {
  const { isOpen, isDesktop, toggle, close } = useSidebar();

  return (
    <div className={`app ${isOpen ? "sidebar-open" : ""}`}>
      <header className="mobile-topbar">
        <button
          type="button"
          className="menu-toggle"
          onClick={toggle}
          aria-label={isOpen ? "Close menu" : "Open menu"}
        >
          {isOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
        <span className="mobile-topbar-title">
          <span>IEEE</span> Converter
        </span>
      </header>

      <Sidebar />

      {!isDesktop && isOpen ? (
        <button
          type="button"
          className="sidebar-overlay"
          aria-label="Close sidebar"
          onClick={close}
        />
      ) : null}

      <main className="main">
        <Outlet />
      </main>
    </div>
  );
};

export const AppLayout = () => {
  return (
    <SidebarProvider>
      <AppShell />
    </SidebarProvider>
  );
};
