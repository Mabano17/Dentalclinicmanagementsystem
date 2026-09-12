"use client";

import { useEffect, useState } from "react";
import {
  FiUsers, FiCalendar, FiCheckCircle, FiClock,
  FiDollarSign, FiActivity, FiAlertCircle, FiUserCheck,
} from "react-icons/fi";
import { MdOutlineMedicalServices } from "react-icons/md";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from "recharts";
import PageLayout from "@/components/PageLayout";
import AuthGuard from "@/components/AuthGuard";
import DashboardCard from "@/components/DashboardCard";
import ErrorMessage from "@/components/ErrorMessage";
import { dashboardAPI } from "@/lib/api";
import { formatCurrency, extractError } from "@/lib/utils";

interface AdminStats {
  total_patients: number;
  total_dentists: number;
  todays_appointments: number;
  pending_appointments: number;
  confirmed_appointments: number;
  completed_appointments: number;
  total_services: number;
  total_revenue: number;
  monthly_appointments: { month: string; count: number }[];
  appointment_status_dist: { name: string; value: number }[];
  monthly_revenue: { month: string; revenue: number }[];
  popular_services: { name: string; count: number }[];
}

const PIE_COLORS = ["#f59e0b", "#3b82f6", "#10b981", "#ef4444"];

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchStats = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await dashboardAPI.getAdminStats();
      setStats(data);
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  return (
    <AuthGuard requiredRole="admin">
      <PageLayout role="admin" title="Admin Dashboard">
        <div className="mb-6">
          <h2 className="page-title">Dashboard Overview</h2>
          <p className="page-subtitle">Real-time clinic statistics and analytics.</p>
        </div>

        {error && <ErrorMessage message={error} onRetry={fetchStats} />}

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <DashboardCard title="Total Patients" value={stats?.total_patients ?? 0} icon={FiUsers} color="blue" loading={loading} />
          <DashboardCard title="Total Dentists" value={stats?.total_dentists ?? 0} icon={FiUserCheck} color="teal" loading={loading} />
          <DashboardCard title="Today's Appointments" value={stats?.todays_appointments ?? 0} icon={FiCalendar} color="purple" loading={loading} />
          <DashboardCard title="Total Services" value={stats?.total_services ?? 0} icon={MdOutlineMedicalServices} color="indigo" loading={loading} />
          <DashboardCard title="Pending" value={stats?.pending_appointments ?? 0} icon={FiAlertCircle} color="orange" loading={loading} />
          <DashboardCard title="Confirmed" value={stats?.confirmed_appointments ?? 0} icon={FiClock} color="blue" loading={loading} />
          <DashboardCard title="Completed" value={stats?.completed_appointments ?? 0} icon={FiCheckCircle} color="green" loading={loading} />
          <DashboardCard title="Total Revenue" value={formatCurrency(stats?.total_revenue ?? 0)} icon={FiDollarSign} color="green" loading={loading} />
        </div>

        {/* Charts row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
          {/* Monthly appointments */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FiCalendar className="w-4 h-4 text-blue-600" /> Monthly Appointments
            </h3>
            {loading ? (
              <div className="h-48 bg-gray-100 rounded-xl animate-pulse" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stats?.monthly_appointments ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Appointments" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Appointment status distribution */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FiActivity className="w-4 h-4 text-purple-600" /> Appointment Status
            </h3>
            {loading ? (
              <div className="h-48 bg-gray-100 rounded-xl animate-pulse" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={stats?.appointment_status_dist ?? []}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {(stats?.appointment_status_dist ?? []).map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend iconType="circle" iconSize={8} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Charts row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Monthly revenue */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FiDollarSign className="w-4 h-4 text-green-600" /> Monthly Revenue
            </h3>
            {loading ? (
              <div className="h-48 bg-gray-100 rounded-xl animate-pulse" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={stats?.monthly_revenue ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} name="Revenue" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Popular services */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MdOutlineMedicalServices className="w-4 h-4 text-indigo-600" /> Popular Services
            </h3>
            {loading ? (
              <div className="h-48 bg-gray-100 rounded-xl animate-pulse" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stats?.popular_services ?? []} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={120} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} name="Bookings" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </PageLayout>
    </AuthGuard>
  );
}
