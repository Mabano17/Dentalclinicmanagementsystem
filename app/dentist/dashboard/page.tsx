"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PageLayout from "@/components/PageLayout";
import AuthGuard from "@/components/AuthGuard";
import DashboardCard from "@/components/DashboardCard";
import { FaCalendarAlt, FaClock, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import { appointmentsAPI } from "@/lib/api";
import { formatDate, formatTime, getStatusColor, extractError } from "@/lib/utils";
import { getUser } from "@/lib/auth";
import { useToast } from "@/components/Toast";

interface Appointment {
  id: string;
  patient_details: { full_name: string };
  service_details: { name: string } | null;
  appointment_date: string;
  appointment_time: string;
  status: string;
}

function DentistDashboardPage() {
  const { showToast } = useToast();
  const [user, setUser] = useState<ReturnType<typeof getUser>>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, completed: 0, cancelled: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => { setUser(getUser()); }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await appointmentsAPI.getAll({ page_size: 100 });
        const all: Appointment[] = data.results ?? [];
        setAppointments(
          all
            .filter((a) => ["PENDING", "CONFIRMED"].includes(a.status))
            .sort((a, b) => a.appointment_date.localeCompare(b.appointment_date))
            .slice(0, 5)
        );
        setStats({
          total: data.count ?? 0,
          pending: all.filter((a) => a.status === "PENDING").length,
          completed: all.filter((a) => a.status === "COMPLETED").length,
          cancelled: all.filter((a) => a.status === "CANCELLED").length,
        });
      } catch (err) { showToast(extractError(err), "error"); }
      finally { setLoading(false); }
    };
    load();
  }, [showToast]);

  return (
    <AuthGuard role="DENTIST">
      <PageLayout title="My Dashboard">
      <div className="p-6 space-y-6">
        {/* Welcome */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
          <h2 className="text-2xl font-bold">Welcome, Dr. {user?.full_name} 👋</h2>
          <p className="mt-1 text-blue-100">Manage your appointments and patient schedules here.</p>
          <Link href="/dentist/appointments"
            className="inline-block mt-4 px-5 py-2.5 bg-white text-blue-700 rounded-xl text-sm font-semibold hover:bg-blue-50 transition-colors">
            View Appointments
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <DashboardCard title="Total" value={stats.total} icon={FaCalendarAlt} color="blue" />
          <DashboardCard title="Pending" value={stats.pending} icon={FaClock} color="orange" />
          <DashboardCard title="Completed" value={stats.completed} icon={FaCheckCircle} color="green" />
          <DashboardCard title="Cancelled" value={stats.cancelled} icon={FaTimesCircle} color="red" />
        </div>

        {/* Upcoming */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-700">Upcoming Appointments</h3>
            <Link href="/dentist/appointments" className="text-sm text-blue-600 hover:underline">View all</Link>
          </div>
          {loading ? (
            <div className="py-8 text-center text-gray-400 text-sm">Loading…</div>
          ) : appointments.length === 0 ? (
            <p className="py-8 text-center text-gray-400 text-sm">No upcoming appointments.</p>
          ) : (
            <div className="space-y-3">
              {appointments.map((a) => (
                <div key={a.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <div>
                    <p className="font-medium text-sm text-gray-800">{a.patient_details?.full_name}</p>
                    <p className="text-xs text-gray-500">{a.service_details?.name ?? "General Consultation"}</p>
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
    </AuthGuard>
  );
}

export default DentistDashboardPage;
