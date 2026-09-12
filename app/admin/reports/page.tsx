"use client";

import { useEffect, useState, useCallback } from "react";
import {
  FiUsers, FiCalendar, FiCheckCircle, FiXCircle,
  FiClock, FiActivity, FiDollarSign, FiDownload,
} from "react-icons/fi";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area,
} from "recharts";
import PageLayout from "@/components/PageLayout";
import AuthGuard from "@/components/AuthGuard";
import DashboardCard from "@/components/DashboardCard";
import ErrorMessage from "@/components/ErrorMessage";
import { reportsAPI } from "@/lib/api";
import { formatCurrency, extractError } from "@/lib/utils";

interface ReportSummary {
  total_patients: number;
  total_appointments: number;
  completed_appointments: number;
  cancelled_appointments: number;
  pending_appointments: number;
  total_treatments: number;
  total_payments: number;
  total_revenue: number;
}

interface ChartData {
  daily_appointments: { date: string; count: number }[];
  monthly_appointments: { month: string; count: number }[];
  appointment_status_dist: { name: string; value: number }[];
  popular_services: { name: string; count: number }[];
  monthly_revenue: { month: string; revenue: number }[];
  payment_status_dist: { name: string; value: number }[];
}

const PIE_COLORS = ["#f59e0b", "#3b82f6", "#10b981", "#ef4444", "#8b5cf6"];

export default function AdminReportsPage() {
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [charts, setCharts] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const fetchReports = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const params: Record<string, unknown> = {};
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      const [sumRes, apptRes, revRes, svcRes] = await Promise.all([
        reportsAPI.getSummary(params),
        reportsAPI.getAppointments(params),
        reportsAPI.getRevenue(params),
        reportsAPI.getServices(params),
      ]);
      setSummary(sumRes.data);
      setCharts({
        daily_appointments: apptRes.data.daily ?? [],
        monthly_appointments: apptRes.data.monthly ?? [],
        appointment_status_dist: apptRes.data.status_dist ?? [],
        popular_services: svcRes.data.popular ?? [],
        monthly_revenue: revRes.data.monthly ?? [],
        payment_status_dist: revRes.data.payment_status_dist ?? [],
      });
    } catch (err) { setError(extractError(err)); }
    finally { setLoading(false); }
  }, [dateFrom, dateTo]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const handlePrint = () => window.print();

  return (
    <AuthGuard requiredRole="admin">
      <PageLayout role="admin" title="Reports">
        <div className="page-header">
          <div>
            <h2 className="page-title">Reports &amp; Analytics</h2>
            <p className="page-subtitle">Comprehensive clinic performance overview.</p>
          </div>
          <button onClick={handlePrint} className="btn-outline">
            <FiDownload className="w-4 h-4" /> Export / Print
          </button>
        </div>

        {/* Date range filter */}
        <div className="card mb-6">
          <div className="flex flex-wrap items-end gap-4">
            <div className="form-group">
              <label className="label">From Date</label>
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="input h-10 w-40" />
            </div>
            <div className="form-group">
              <label className="label">To Date</label>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="input h-10 w-40" />
            </div>
            <button onClick={() => fetchReports()} className="btn-primary h-10">Apply Filter</button>
            {(dateFrom || dateTo) && (
              <button onClick={() => { setDateFrom(""); setDateTo(""); }} className="btn-secondary h-10">Clear</button>
            )}
          </div>
        </div>

        {error && <ErrorMessage message={error} onRetry={fetchReports} />}

        {/* Summary stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <DashboardCard title="Total Patients" value={summary?.total_patients ?? 0} icon={FiUsers} color="blue" loading={loading} />
          <DashboardCard title="Total Appointments" value={summary?.total_appointments ?? 0} icon={FiCalendar} color="purple" loading={loading} />
          <DashboardCard title="Completed" value={summary?.completed_appointments ?? 0} icon={FiCheckCircle} color="green" loading={loading} />
          <DashboardCard title="Cancelled" value={summary?.cancelled_appointments ?? 0} icon={FiXCircle} color="red" loading={loading} />
          <DashboardCard title="Pending" value={summary?.pending_appointments ?? 0} icon={FiClock} color="orange" loading={loading} />
          <DashboardCard title="Total Treatments" value={summary?.total_treatments ?? 0} icon={FiActivity} color="teal" loading={loading} />
          <DashboardCard title="Total Payments" value={summary?.total_payments ?? 0} icon={FiDollarSign} color="indigo" loading={loading} />
          <DashboardCard title="Total Revenue" value={formatCurrency(summary?.total_revenue ?? 0)} icon={FiDollarSign} color="green" loading={loading} />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
          {/* Daily appointments */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">Daily Appointments</h3>
            {loading ? <div className="h-48 bg-gray-100 rounded-xl animate-pulse" /> : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={charts?.daily_appointments ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="count" stroke="#3b82f6" fill="#dbeafe" name="Appointments" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Monthly appointments */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">Monthly Appointments</h3>
            {loading ? <div className="h-48 bg-gray-100 rounded-xl animate-pulse" /> : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={charts?.monthly_appointments ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4,4,0,0]} name="Appointments" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Appointment status */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">Appointment Status Distribution</h3>
            {loading ? <div className="h-48 bg-gray-100 rounded-xl animate-pulse" /> : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={charts?.appointment_status_dist ?? []} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">
                    {(charts?.appointment_status_dist ?? []).map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend iconType="circle" iconSize={8} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Popular services */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">Popular Services</h3>
            {loading ? <div className="h-48 bg-gray-100 rounded-xl animate-pulse" /> : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={charts?.popular_services ?? []} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={130} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[0,4,4,0]} name="Bookings" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Monthly revenue */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">Monthly Revenue</h3>
            {loading ? <div className="h-48 bg-gray-100 rounded-xl animate-pulse" /> : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={charts?.monthly_revenue ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₱${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} name="Revenue" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Payment status */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">Payment Status</h3>
            {loading ? <div className="h-48 bg-gray-100 rounded-xl animate-pulse" /> : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={charts?.payment_status_dist ?? []} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">
                    {(charts?.payment_status_dist ?? []).map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend iconType="circle" iconSize={8} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </PageLayout>
    </AuthGuard>
  );
}
