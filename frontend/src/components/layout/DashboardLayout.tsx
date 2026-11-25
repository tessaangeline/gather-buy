
import { useState } from "react";
import "./DashboardLayout.css";
import type { ReactNode } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

interface DashboardLayoutProps {
  title: string;
  children: ReactNode;
}

function DashboardLayout({ title, children }: DashboardLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsCollapsed((prev) => !prev);
  };

  return (
    <div
      className={`dashboard-layout ${isCollapsed ? "sidebar-collapsed" : ""}`}
    >
      <Sidebar
        isCollapsed={isCollapsed}
        onToggle={toggleSidebar}
      />

      <div className="dashboard-main">
        <Navbar title={title} />

        <main className="dashboard-content">
          {children}
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
