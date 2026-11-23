import "./DashboardLayout.css";
import type { ReactNode } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

interface DashboardLayoutProps {
  title: string;
  children: ReactNode;
}

function DashboardLayout({ title, children }: DashboardLayoutProps) {
  return (
    <div className="dashboard-layout">
      <Sidebar />

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
