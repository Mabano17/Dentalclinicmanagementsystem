"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FiCalendar,
  FiCheckCircle,
  FiDollarSign,
  FiPlusCircle,
  FiClipboard,
  FiMessageSquare,
  FiUser,
  FiClock,
} from "react-icons/fi";
import PageLayout from "@/components/PageLayout";
import AuthGuard from "@/components/AuthGuard";
import DashboardCard from "@/components/DashboardCard";
import ErrorMessage from "@/components/ErrorMessage";
import { dashboardAPI, appointmentsAPI } from "@/lib/api";
import { getUser } from "@/lib/auth";
import { formatDate, formatTime, getStatusColor, formatCurrency, extractError } from "@/lib/utils";

interface PatientStats {
  total_appointments: number;
  upcoming_appointments: number;
  completed_treatments: number;
  outstanding_balance: number;
}

interface Appointment {
  id: number;
  service_name: string;
  dentist_name: string;
  date: string;
  time: string;
  status: string;
}

export default function PatientDashboardPage() {
  const user = getUser();
  const [stats, setStats] = useState<PatientStats | null>(null);
  const [upcoming, setUpcoming] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [statsRes, apptRes] = await Promise.all([
        dashboardAPI.getPatientStats(),
        appointmentsAPI.getAll({ status: "confirmed", page_size: 3, ordering: "date" }),
      ]);
      setStats(statsRes.data);
      setUpcoming(apptRes.data.results ?? apptRes.data);
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const quickLinks = [
    { label: "Book Appointment", href: "/patient/book-appointment", icon: FiPlusCircle, color: "bg-blue-600" },
    { label: "My Appointments", href: "/patient/appointments", icon: FiCalendar, color: "bg-teal-600" },
    { label: "My Treatments", href: "/patient/treatments", icon: FiClipboard, color: "bg-purple-600" },
    { label: "My Payments", href: "/patient/payments", icon: FiDollarSign, color: "bg-green-600" },
    { label: "Messages", href: "/patient/messages", icon: FiMessageSquare, color: "bg-orange-600" },
    { label: "My Profile", href: "/patient/profile", icon: FiUser, color: "bg-indigo-600" },
  ];

  return (
    <AuthGuard requiredRole="patient">
      <PageLayout role="patient" title="Patient Dashboard">
        {/* Welcome */}
        <div className="mb-6 bg-gradient-to-r from-blue-600 to-teal-500 rounded-2xl p-6 text-white">
          <p className="text-blue-100 text-sm">Welcome back,</p>
          <h2 className="text-2xl font-bold mt-0.5">
            {user?.full_name ?? user?.username} 👋
          </h2>
          <p className="text-blue-100 text-sm mt-1">
            Manage your dental appointments and health records all in one place.
          </p>
        </div>

        {error && <ErrorMessage message={error} onRetry={fetchData} />}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <DashboardCard
            title="Total Appointments"
            value={stats?.total_appointments ?? 0}
            icon={FiCalendar}
            color="blue"
            loading={loading}
          />
          <DashboardCard
            title="Upcoming"
            value={stats?.upcoming_appointments ?? 0}
            icon={FiClock}
            color="teal"
            loading={loading}
          />
          <DashboardCard
            title="Completed Treatments"
            value={stats?.completed_treatments ?? 0}
            icon={FiCheckCircle}
            color="green"
            loading={loading}
          />
          <DashboardCard
            title="Outstanding Balance"
            value={formatCurrency(stats?.outstanding_balance ?? 0)}
            icon={FiDollarSign}
            color="orange"
            loading={loading}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Links */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              {quickLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-all group"
                >
                  <div className={`w-10 h-10 ${link.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <link.icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xs font-medium text-gray-700 text-center leading-tight">
                    {link.label}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* Upcoming Appointments */}
          <div className="card lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Upcoming Appointments</h3>
              <Link href="/patient/appointments" className="text-sm text-blue-600 hover:underline">
                View all
              </Link>
            </div>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : upcoming.length === 0 ? (
              <div className="text-center py-8">
                <FiCalendar className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No upcoming appointments.</p>
                <Link
                  href="/patient/book-appointment"
                  className="btn-primary btn-sm mt-3 inline-flex"
                >
                  Book Now
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {upcoming.map((appt) => (
                  <div
                    key={appt.id}
                    className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 border border-gray-100"
                  >
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <FiCalendar className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {appt.service_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        Dr. {appt.dentist_name} · {formatDate(appt.date)} at {formatTime(appt.time)}
                      </p>
                    </div>
                    <span className={`badge ${getStatusColor(appt.status)}`}>
                      {appt.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </PageLayout>
    </AuthGuard>
  );
}
