"use client";

import { useState, useEffect } from "react";
import { FiBell, FiMessageSquare } from "react-icons/fi";
import { messagesAPI } from "@/lib/api";
import { getUser } from "@/lib/auth";
import { getInitials } from "@/lib/utils";
import Link from "next/link";

interface NavbarProps {
  title: string;
  role: "admin" | "patient";
}

export default function Navbar({ title, role }: NavbarProps) {
  const user = getUser();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const { data } = await messagesAPI.getUnreadCount();
        setUnreadCount(data.count ?? 0);
      } catch {
        // silent — not critical
      }
    };
    fetchUnread();
  }, []);

  const messagesHref =
    role === "admin" ? "/admin/messages" : "/patient/messages";

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center px-6 gap-4 sticky top-0 z-30">
      {/* Title — pushed right of sidebar on desktop */}
      <h1 className="flex-1 text-base font-semibold text-gray-900 ml-10 lg:ml-0">
        {title}
      </h1>

      <div className="flex items-center gap-2">
        {/* Messages */}
        <Link
          href={messagesHref}
          className="relative p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"
          aria-label="Messages"
        >
          <FiMessageSquare className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-blue-600 rounded-full" />
          )}
        </Link>

        {/* Notifications placeholder */}
        <button
          className="relative p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"
          aria-label="Notifications"
        >
          <FiBell className="w-5 h-5" />
        </button>

        {/* Avatar */}
        <div className="flex items-center gap-2 ml-1 pl-3 border-l border-gray-100">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-teal-500 flex items-center justify-center text-white text-xs font-bold">
            {getInitials(user?.full_name ?? user?.username ?? "?")}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-gray-900 leading-tight">
              {user?.full_name ?? user?.username}
            </p>
            <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
