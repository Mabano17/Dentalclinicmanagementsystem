"use client";

import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { ToastProvider } from "./Toast";

interface PageLayoutProps {
  children: React.ReactNode;
  role: "admin" | "patient";
  title: string;
}

export default function PageLayout({ children, role, title }: PageLayoutProps) {
  return (
    <ToastProvider>
      <div className="flex h-screen overflow-hidden bg-gray-50">
        <Sidebar role={role} />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Navbar title={title} role={role} />
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </ToastProvider>
  );
}
