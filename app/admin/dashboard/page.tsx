"use client";

import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from "recharts";
import PageLayout from "@/components/PageLayout";
import DashboardCard from "@/components/DashboardCard";
import { reportsAPI } from "@/lib/api";
import { extractError, formatCurrency } from "@/lib/utils";

const PIE_COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444"];

interface DashboardData {
  total_patients: number;
  active_patients: number;
  total_dentists: number;
  active_dentists: number;
  total_services: number;
  total_appointments: number;
  pending_appointments: number;
  confirmed_appointments: number;
  completed_appointments: number;
  cancelled_appointments: number;
  total_treatments: number;
  total_payments: number;
  paid_payments: number;
  pending_payments: number;
  total_revenue: number;
  todays_appointments: number;
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [apptMonthly, setApptMonthly] = useState<unknown[]>([]);
  const [revenueMonthly, setRevenueMonthly] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const [dashRes, apptRes, revRes] = await Promise.all([
          reportsAPI.getDashboard(),
          reportsAPI.getAppointments(),
          reportsAPI.getRevenue(),
        ]);
        setData(dashRes.data.data);
        setApptMonthly(apptRes.data.data.monthly_statistics ?? []);
        setRevenueMonthly(revRes.data.data.monthly_revenue ?? []);
      } catch (err) {
        setError(extractError(err));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return (
    <PageLayout title="Dashboard">
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    </PageLayout>
  );

  if (error) return (
    <PageLayout title="Dashboard">
      <div className="p-6 text-red-600">{error}</div>
    </PageLayout>
  );

  const apptPieData = data ? [
    { name: "Pending", value: data.pending_appointments },
    { name: "Confirmed", value: data.confirmed_appointments },
    { name: "Completed", value: data.completed_appointments },
    { name: "Cancelled", value: data.cancelled_appointments },
  ] : [];

  return (
    <PageLayout title="Dashboard">
      <div className="p-6 space-y-6">

        {/* KPI Cards — Row 1 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <DashboardCard title="Total Patients" value={data?.total_patients ?? 0} icon="👥" color="blue" />
          <DashboardCard title="Total Dentists" value={data?.active_dentists ?? 0} icon="🦷" color="green" />
          <DashboardCard title="Today's Appointments" value={data?.todays_appointments ?? 0} icon="📅" color="purple" />
          <DashboardCard title="Total Revenue" value={formatCurrency(data?.total_revenue ?? 0)} icon="💰" color="yellow" />
        </div>

        {/* KPI Cards — Row 2 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <DashboardCard title="All Appointments" value={data?.total_appointments ?? 0} icon="📋" color="blue" />
          <DashboardCard title="Pending" value={data?.pending_appointments ?? 0} icon="⏳" color="yellow" />
          <DashboardCard title="Completed" value={data?.completed_appointments ?? 0} icon="✅" color="green" />
          <DashboardCard title="Cancelled" value={data?.cancelled_appointments ?? 0} icon="❌" color="red" />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Monthly Appointments Bar */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-700 mb-4">Monthly Appointments</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={apptMonthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="completed" name="Completed" fill="#10B981" radius={[3, 3, 0, 0]} />
                <Bar dataKey="pending" name="Pending" fill="#F59E0B" radius={[3, 3, 0, 0]} />
                <Bar dataKey="cancelled" name="Cancelled" fill="#EF4444" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Appointment Status Pie */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-700 mb-4">Appointment Status</h3>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={apptPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {apptPieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Monthly Revenue Line */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 lg:col-span-2">
            <h3 className="font-semibold text-gray-700 mb-4">Monthly Revenue</h3>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={revenueMonthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#3B82F6" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bottom stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <DashboardCard title="Total Treatments" value={data?.total_treatments ?? 0} icon="💊" color="purple" />
          <DashboardCard title="Paid Payments" value={data?.paid_payments ?? 0} icon="✅" color="green" />
          <DashboardCard title="Pending Payments" value={data?.pending_payments ?? 0} icon="⏳" color="yellow" />
        </div>
      </div>
    </PageLayout>
  );
}
