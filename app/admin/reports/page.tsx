"use client";

import { useEffect, useState, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from "recharts";
import PageLayout from "@/components/PageLayout";
import DashboardCard from "@/components/DashboardCard";
import { FaUsers, FaCalendarAlt, FaCheckCircle, FaMoneyBillWave, FaClock, FaTimesCircle, FaPills, FaCreditCard } from "react-icons/fa";
import { reportsAPI } from "@/lib/api";
import { formatCurrency, extractError } from "@/lib/utils";
import { useToast } from "@/components/Toast";

const PIE_COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

export default function AdminReportsPage() {
  const { showToast } = useToast();
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [dashboard, setDashboard] = useState<Record<string, number>>({});
  const [apptData, setApptData] = useState<{ monthly: unknown[]; statusBreakdown: unknown[]; topDentists: unknown[] }>({ monthly: [], statusBreakdown: [], topDentists: [] });
  const [revenueData, setRevenueData] = useState<{ monthly: unknown[]; methodBreakdown: unknown[] }>({ monthly: [], methodBreakdown: [] });
  const [serviceData, setServiceData] = useState<{ popular: unknown[] }>({ popular: [] });
  const load = useCallback(async () => {
    const params = { date_from: dateFrom || undefined, date_to: dateTo || undefined };
    try {
      const [d, a, r, s] = await Promise.all([
        reportsAPI.getDashboard(params),
        reportsAPI.getAppointments(params),
        reportsAPI.getRevenue(params),
        reportsAPI.getServices(params),
      ]);
      setDashboard(d.data.data);
      setApptData({ monthly: a.data.data.monthly_statistics ?? [], statusBreakdown: a.data.data.status_breakdown ?? [], topDentists: a.data.data.top_dentists ?? [] });
      setRevenueData({ monthly: r.data.data.monthly_revenue ?? [], methodBreakdown: r.data.data.payment_method_breakdown ?? [] });
      setServiceData({ popular: s.data.data.popular_services ?? [] });
    } catch (err) { showToast(extractError(err), "error"); }
  }, [dateFrom, dateTo, showToast]);

  useEffect(() => { load(); }, [load]);

  return (
    <PageLayout title="Reports & Analytics">
      <div className="p-6 space-y-6">
        {/* Date range filter */}
        <div className="flex flex-wrap gap-3 items-center bg-white rounded-xl border border-gray-200 p-4">
          <span className="text-sm font-medium text-gray-600">Date Range:</span>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <span className="text-sm text-gray-400">to</span>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          {(dateFrom || dateTo) && (
            <button onClick={() => { setDateFrom(""); setDateTo(""); }} className="text-sm text-blue-600 hover:underline">Clear</button>
          )}
          <button onClick={() => window.print()} className="ml-auto px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200">🖨 Print</button>
        </div>

        {/* KPI Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <DashboardCard title="Total Patients" value={dashboard.total_patients ?? 0} icon={FaUsers} color="blue" />
          <DashboardCard title="Total Appointments" value={dashboard.total_appointments ?? 0} icon={FaCalendarAlt} color="purple" />
          <DashboardCard title="Completed" value={dashboard.completed_appointments ?? 0} icon={FaCheckCircle} color="green" />
          <DashboardCard title="Total Revenue" value={formatCurrency(dashboard.total_revenue ?? 0)} icon={FaMoneyBillWave} color="orange" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <DashboardCard title="Pending" value={dashboard.pending_appointments ?? 0} icon={FaClock} color="orange" />
          <DashboardCard title="Cancelled" value={dashboard.cancelled_appointments ?? 0} icon={FaTimesCircle} color="red" />
          <DashboardCard title="Total Treatments" value={dashboard.total_treatments ?? 0} icon={FaPills} color="purple" />
          <DashboardCard title="Paid Payments" value={dashboard.paid_payments ?? 0} icon={FaCreditCard} color="green" />
        </div>

        {/* Charts row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-700 mb-4">Monthly Appointments</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={apptData.monthly as Record<string, unknown>[]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="completed" name="Completed" fill="#10B981" radius={[3,3,0,0]} />
                <Bar dataKey="pending" name="Pending" fill="#F59E0B" radius={[3,3,0,0]} />
                <Bar dataKey="cancelled" name="Cancelled" fill="#EF4444" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-700 mb-4">Appointment Status</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={apptData.statusBreakdown as { status: string; count: number }[]}
                  dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={80}
                  label={({ status, percent }: { status: string; percent: number }) => `${status} ${(percent * 100).toFixed(0)}%`}>
                  {(apptData.statusBreakdown as unknown[]).map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Charts row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5 lg:col-span-2">
            <h3 className="font-semibold text-gray-700 mb-4">Monthly Revenue</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={revenueData.monthly as Record<string, unknown>[]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `₱${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#3B82F6" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Charts row 3 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-700 mb-4">Payment Method Breakdown</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={revenueData.methodBreakdown as { method: string; total: number }[]}
                  dataKey="total" nameKey="method" cx="50%" cy="50%" outerRadius={80} label>
                  {(revenueData.methodBreakdown as unknown[]).map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-700 mb-4">Popular Services</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={(serviceData.popular as Record<string, unknown>[]).slice(0, 7)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="service_name" tick={{ fontSize: 10 }} width={130} />
                <Tooltip />
                <Bar dataKey="total_appointments" name="Appointments" fill="#8B5CF6" radius={[0,3,3,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Dentists table */}
        {apptData.topDentists.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-700 mb-4">Top Dentists by Appointments</h3>
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-100">
                <th className="text-left py-2 text-gray-500 font-medium">Dentist</th>
                <th className="text-right py-2 text-gray-500 font-medium">Appointments</th>
              </tr></thead>
              <tbody>
                {(apptData.topDentists as { dentist__full_name: string; appointment_count: number }[]).map((d, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="py-2">Dr. {d.dentist__full_name}</td>
                    <td className="py-2 text-right font-medium text-blue-600">{d.appointment_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
