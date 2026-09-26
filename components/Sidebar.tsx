"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  FiHome,
  FiCalendar,
  FiUsers,
  FiActivity,
  FiDollarSign,
  FiMessageSquare,
  FiUser,
  FiLogOut,
  FiMenu,
  FiX,
  FiSettings,
  FiClipboard,
  FiBarChart2,
  FiList,
  FiPlusCircle,
  FiFileText,
} from "react-icons/fi";
import { MdOutlineMedicalServices } from "react-icons/md";
import { logout, getUser } from "@/lib/auth";
import { getInitials } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const adminNav: NavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: FiHome },
  { label: "Patients", href: "/admin/patients", icon: FiUsers },
  { label: "Dentists", href: "/admin/dentists", icon: FiUser },
  { label: "Services", href: "/admin/services", icon: MdOutlineMedicalServices },
  { label: "Appointments", href: "/admin/appointments", icon: FiCalendar },
  { label: "Treatments", href: "/admin/treatments", icon: FiActivity },
  { label: "Payments", href: "/admin/payments", icon: FiDollarSign },
  { label: "Messages", href: "/admin/messages", icon: FiMessageSquare },
  { label: "Activity Logs", href: "/admin/activity-logs", icon: FiList },
  { label: "Reports", href: "/admin/reports", icon: FiBarChart2 },
];

const patientNav: NavItem[] = [
  { label: "Dashboard", href: "/patient/dashboard", icon: FiHome },
  { label: "My Appointments", href: "/patient/appointments", icon: FiCalendar },
  { label: "Book Appointment", href: "/patient/book-appointment", icon: FiPlusCircle },
  { label: "My Treatments", href: "/patient/treatments", icon: FiClipboard },
  { label: "My Payments", href: "/patient/payments", icon: FiDollarSign },
  { label: "Messages", href: "/patient/messages", icon: FiMessageSquare },
  { label: "My Profile", href: "/patient/profile", icon: FiSettings },
];

const dentistNav: NavItem[] = [
  { label: "Dashboard", href: "/dentist/dashboard", icon: FiHome },
  { label: "Appointments", href: "/dentist/appointments", icon: FiCalendar },
];

interface SidebarProps {
  role: "ADMIN" | "PATIENT" | "DENTIST";
}

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<ReturnType<typeof getUser>>(null);

  useEffect(() => {
    setUser(getUser());
  }, []);
  const navItems = role === "ADMIN" ? adminNav : role === "DENTIST" ? dentistNav : patientNav;

  const NavLinks = () => (
    <nav className="flex flex-col gap-1 flex-1 mt-2">
      {navItems.map((item) => {
        const isActive =
          pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={`sidebar-link ${
              isActive ? "sidebar-link-active" : "sidebar-link-inactive"
            }`}
          >
            <item.icon className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  const UserSection = () => (
    <div className="border-t border-gray-100 pt-4 mt-2">
      <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-gray-50">
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
          {getInitials(user?.full_name ?? user?.username ?? "?")}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {user?.full_name ?? user?.username}
          </p>
          <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
        </div>
      </div>
      <button
        onClick={logout}
        className="sidebar-link sidebar-link-inactive w-full mt-1 text-red-500 hover:bg-red-50 hover:text-red-600"
      >
        <FiLogOut className="w-4 h-4" />
        <span>Logout</span>
      </button>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2 bg-white rounded-xl shadow-card border border-gray-200"
        aria-label="Open sidebar"
      >
        <FiMenu className="w-5 h-5 text-gray-600" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-50 w-64 bg-white border-r border-gray-100 flex flex-col p-4
          transition-transform duration-300 ease-in-out
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:static lg:z-auto
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-teal-500 flex items-center justify-center">
              <FiFileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 leading-tight">
                DentalCare
              </p>
              <p className="text-xs text-gray-400">Clinic System</p>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            aria-label="Close sidebar"
          >
            <FiX className="w-4 h-4" />
          </button>
        </div>

        <NavLinks />
        <UserSection />
      </aside>
    </>
  );
}
