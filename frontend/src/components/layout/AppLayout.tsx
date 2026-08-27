import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";

export const AppLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    return typeof window !== "undefined" ? window.innerWidth >= 1024 : true;
  });

  return (
    <div className="h-screen h-[100dvh] w-full bg-[#f4f6fa] flex font-sans overflow-hidden">
      {/* 1. Sidebar (Fixed permanently) */}
      <Sidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen((prev) => !prev)}
        onCloseMobile={() => setIsSidebarOpen(false)}
      />

      {/* 2. Main content area */}
      <div className="flex-1 flex flex-col min-w-0 h-full w-full overflow-hidden">
        <Navbar onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)} />
        <main className="flex-1 p-3.5 sm:p-5 lg:p-7 overflow-y-auto overflow-x-hidden w-full max-w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
