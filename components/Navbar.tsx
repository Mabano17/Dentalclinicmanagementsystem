"use client";

import { useState, useEffect, useRef } from "react";
import { FiBell, FiMessageSquare, FiLogOut, FiUser } from "react-icons/fi";
import { messagesAPI, authAPI } from "@/lib/api";
import { getUser, clearTokens, getRefreshToken } from "@/lib/auth";
import { getInitials } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface NavbarProps {
  title: string;
  role: "ADMIN" | "PATIENT" | "DENTIST";
}

export default function Navbar({ title, role }: NavbarProps) {
  const router = useRouter();
  const [user, setUser] = useState<ReturnType<typeof getUser>>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    setUser(getUser());
  }, []);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Poll unread message count
  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const { data } = await messagesAPI.getAll({ is_read: false, page_size: 1 });
        setUnreadCount(data.count ?? 0);
      } catch { /* silent */ }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    try {
      const refresh = getRefreshToken();
      if (refresh) await authAPI.logout(refresh);
    } catch { /* ignore */ } finally {
      clearTokens();
      router.push("/login");
    }
  };

  const messagesHref = role === "ADMIN" ? "/admin/messages" : role === "DENTIST" ? "/dentist/messages" : "/patient/messages";
  const profileHref = role === "PATIENT" ? "/patient/profile" : role === "DENTIST" ? "/dentist/profile" : undefined;

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center px-6 gap-4 sticky top-0 z-30">
      <h1 className="flex-1 text-base font-semibold text-gray-900 ml-10 lg:ml-0">
        {title}
      </h1>

      <div className="flex items-center gap-2">
        {/* Messages */}
        <Link href={messagesHref}
          className="relative p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"
          aria-label="Messages">
          <FiMessageSquare className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-blue-600 rounded-full" />
          )}
        </Link>

        {/* Notifications placeholder */}
        <button className="relative p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors" aria-label="Notifications">
          <FiBell className="w-5 h-5" />
        </button>

        {/* Avatar + dropdown */}
        <div className="relative ml-1 pl-3 border-l border-gray-100" ref={menuRef}>
          <button onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 hover:bg-gray-50 rounded-xl px-2 py-1 transition-colors">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-teal-500 flex items-center justify-center text-white text-xs font-bold">
              {getInitials(user?.full_name ?? "?")}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-gray-900 leading-tight">{user?.full_name}</p>
              <p className="text-xs text-gray-400">{user?.role}</p>
            </div>
          </button>

          {/* Dropdown */}
          {menuOpen && (
            <div className="absolute right-0 top-12 w-44 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
              {profileHref && (
                <Link href={profileHref} onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                  <FiUser className="w-4 h-4" /> My Profile
                </Link>
              )}
              <button onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                <FiLogOut className="w-4 h-4" /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
