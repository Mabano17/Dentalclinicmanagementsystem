"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PageLayout from "@/components/PageLayout";
import DashboardCard from "@/components/DashboardCard";
import { FaCalendarAlt, FaClock, FaCheckCircle, FaMoneyBillWave } from "react-icons/fa";
import { appointmentsAPI, paymentsAPI } from "@/lib/api";
import { formatDate, formatTime, getStatusColor, extractError } from "@/lib/utils";
import { getUser } from "@/lib/auth";
import { useToast } from "@/components/Toast";

interface Appointment {
  id: string;
  dentist_details: { full_name: string; specialization: string };
  service_details: { name: string } | null;
  appointment_date: string;
  appointment_time: string;
  status: string;
}

export default function PatientDashboardPage() {
  const { showToast } = useToast();
  const [user, setUser] = useState<{ full_name?: string } | null>(null);

  useEffect(() => { getUser().then(setUser); }, []);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, completed: 0, totalPaid: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [apptRes, payRes] = await Promise.all([
          appointmentsAPI.getAll({ page_size: 100 }),
          paymentsAPI.getAll({ payment_status: "PAID", page_size: 100 }),
        ]);

        const all: Appointment[] = apptRes.data.results ?? [];
        const pays = payRes.data.results ?? [];
        const totalPaid = pays.reduce(
          (sum: number, p: { amount: string }) => sum + parseFloat(p.amount || "0"), 0
        );

        setAppointments(
          all
            .filter((a) => ["PENDING", "CONFIRMED"].includes(a.status))
            .sort((a, b) => a.appointment_date.localeCompare(b.appointment_date))
            .slice(0, 5)
        );
        setStats({
          total: apptRes.data.count ?? 0,
          pending: all.filter((a) => a.status === "PENDING").length,
          completed: all.filter((a) => a.status === "COMPLETED").length,
          totalPaid,
        });
      } catch (err) { showToast(extractError(err), "error"); }
      finally { setLoading(false); }
    };
    load();
  }, [showToast]);

  const quickLinks = [
    { href: "/patient/book-appointment", icon: "📅", label: "Book Appointment", color: "bg-blue-50 border-blue-200 text-blue-700" },
    { href: "/patient/appointments", icon: "📋", label: "My Appointments", color: "bg-green-50 border-green-200 text-green-700" },
    { href: "/patient/treatments", icon: "💊", label: "Treatment History", color: "bg-purple-50 border-purple-200 text-purple-700" },
    { href: "/patient/payments", icon: "💳", label: "My Payments", color: "bg-yellow-50 border-yellow-200 text-yellow-700" },
    { href: "/patient/messages", icon: "💬", label: "Messages", color: "bg-pink-50 border-pink-200 text-pink-700" },
    { href: "/patient/profile", icon: "👤", label: "My Profile", color: "bg-gray-50 border-gray-200 text-gray-700" },
  ];

  return (
    <PageLayout title="My Dashboard">
      <div className="p-6 space-y-6">
        {/* Welcome */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
          <h2 className="text-2xl font-bold">Welcome back, {user?.full_name?.split(" ")[0]} 👋</h2>
          <p className="mt-1 text-blue-100">Manage your dental appointments and health records here.</p>
          <Link href="/patient/book-appointment"
            className="inline-block mt-4 px-5 py-2.5 bg-white text-blue-700 rounded-xl text-sm font-semibold hover:bg-blue-50 transition-colors">
            Book an Appointment
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <DashboardCard title="Total Appointments" value={stats.total} icon={FaCalendarAlt} color="blue" />
          <DashboardCard title="Pending" value={stats.pending} icon={FaClock} color="orange" />
          <DashboardCard title="Completed" value={stats.completed} icon={FaCheckCircle} color="green" />
          <DashboardCard title="Total Paid" value={`₱${stats.totalPaid.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`} icon={FaMoneyBillWave} color="purple" />
        </div>

        {/* Quick links */}
        <div>
          <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Quick Access</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {quickLinks.map((l) => (
              <Link key={l.href} href={l.href}
                className={`flex items-center gap-3 p-4 rounded-xl border ${l.color} hover:shadow-sm transition-shadow`}>
                <span className="text-2xl">{l.icon}</span>
                <span className="font-medium text-sm">{l.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Upcoming appointments */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-700">Upcoming Appointments</h3>
            <Link href="/patient/appointments" className="text-sm text-blue-600 hover:underline">View all</Link>
          </div>
          {loading ? (
            <div className="py-8 text-center text-gray-400 text-sm">Loading…</div>
          ) : appointments.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-gray-400 text-sm mb-3">No upcoming appointments.</p>
              <Link href="/patient/book-appointment" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Book Now</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {appointments.map((a) => (
                <div key={a.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <div>
                    <p className="font-medium text-sm text-gray-800">Dr. {a.dentist_details?.full_name}</p>
                    <p className="text-xs text-gray-500">{a.service_details?.name ?? "—"} · {a.dentist_details?.specialization}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-700">{formatDate(a.appointment_date)}</p>
                    <p className="text-xs text-gray-500">{formatTime(a.appointment_time)}</p>
                    <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full border ${getStatusColor(a.status)}`}>{a.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
