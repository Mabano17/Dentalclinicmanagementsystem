"use client";

import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { ToastProvider } from "./Toast";
import { getUserSync } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { setUser } from "@/lib/auth";

interface PageLayoutProps {
  children: React.ReactNode;
  title: string;
}

export default function PageLayout({ children, title }: PageLayoutProps) {
  const [role, setRole] = useState<"ADMIN" | "PATIENT" | "DENTIST">("PATIENT");

  useEffect(() => {
    // Try sync first for instant render
    const cached = getUserSync();
    if (cached) {
      setRole(cached.role);
      return;
    }
    // Fallback to async Supabase
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, full_name, username, phone_number")
        .eq("id", data.user.id)
        .single();
      if (profile) {
        const user = {
          id: data.user.id,
          email: data.user.email!,
          full_name: profile.full_name ?? "",
          username: profile.username ?? "",
          role: (profile.role ?? "PATIENT") as "ADMIN" | "PATIENT" | "DENTIST",
          phone_number: profile.phone_number ?? "",
        };
        setUser(user);
        setRole(user.role);
      }
    });
  }, []);

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
