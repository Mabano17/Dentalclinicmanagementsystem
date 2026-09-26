"use client";

import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { ToastProvider } from "./Toast";
import { getUser } from "@/lib/auth";

interface PageLayoutProps {
  children: React.ReactNode;
  title: string;
}

export default function PageLayout({ children, title }: PageLayoutProps) {
  const user = getUser();
  // Backend returns "ADMIN" | "PATIENT"; normalise to lowercase for Sidebar/Navbar
  const role = (user?.role ?? "PATIENT").toUpperCase() as "ADMIN" | "PATIENT" | "DENTIST";

  return (
    <ToastProvider>
      <div className="flex h-screen overflow-hidden bg-gray-50">
        <Sidebar role={role} />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Navbar title={title} role={role} />
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </ToastProvider>
  );
}
