"use client";

import { useEffect, useState, useCallback } from "react";
import PageLayout from "@/components/PageLayout";
import DataTable from "@/components/DataTable";
import Modal from "@/components/Modal";
import ConfirmDialog from "@/components/ConfirmDialog";
import { FilterSelect } from "@/components/Filter";
import { appointmentsAPI } from "@/lib/api";
import { formatDate, formatTime, getStatusColor, extractError } from "@/lib/utils";
import { useToast } from "@/components/Toast";

interface Appointment {
  id: string;
  dentist_details: { full_name: string; specialization: string };
  service_details: { name: string; price: string } | null;
  appointment_date: string;
  appointment_time: string;
  reason: string;
  status: string;
  notes: string;
}

export default function PatientAppointmentsPage() {
  const { showToast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await appointmentsAPI.getAll({
        page, status: statusFilter || undefined,
      });
      setAppointments(data.results ?? []);
      setCount(data.count ?? 0);
    } catch (err) { showToast(extractError(err), "error"); }
    finally { setLoading(false); }
  }, [page, statusFilter, showToast]);

  useEffect(() => { load(); }, [load]);

  const handleCancel = async () => {
    if (!cancelId) return;
    setCancelling(true);
    try {
      await appointmentsAPI.cancel(cancelId);
      showToast("Appointment cancelled.", "success");
      setCancelId(null);
      load();
    } catch (err) { showToast(extractError(err), "error"); }
    finally { setCancelling(false); }
  };

  const columns = [
    { key: "dentist", header: "Dentist", render: (r: Appointment) => `Dr. ${r.dentist_details?.full_name ?? "—"}` },
    { key: "service", header: "Service", render: (r: Appointment) => r.service_details?.name ?? "—" },
    { key: "date", header: "Date", render: (r: Appointment) => formatDate(r.appointment_date) },
    { key: "time", header: "Time", render: (r: Appointment) => formatTime(r.appointment_time) },
    {
      key: "status", header: "Status",
      render: (r: Appointment) => (
        <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getStatusColor(r.status)}`}>{r.status}</span>
      ),
    },
    {
      key: "actions", header: "Actions",
      render: (r: Appointment) => (
        <div className="flex gap-1">
          <button onClick={() => { setSelected(r); setViewOpen(true); }} className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100">View</button>
          {["PENDING", "CONFIRMED"].includes(r.status) && (
            <button onClick={() => setCancelId(r.id)} className="px-2 py-1 text-xs bg-red-50 text-red-700 rounded hover:bg-red-100">Cancel</button>
          )}
        </div>
      ),
    },
  ];

  return (
    <PageLayout title="My Appointments">
      <div className="p-6">
        <div className="flex gap-3 mb-4 justify-between">
          <FilterSelect placeholder="All Statuses" value={statusFilter} onChange={(v) => { setStatusFilter(v); setPage(1); }}
            options={[
              { value: "PENDING", label: "Pending" },
              { value: "CONFIRMED", label: "Confirmed" },
              { value: "COMPLETED", label: "Completed" },
              { value: "CANCELLED", label: "Cancelled" },
            ]} />
          <a href="/patient/book-appointment" className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">+ Book Appointment</a>
        </div>
        <DataTable columns={columns} data={appointments} loading={loading}
          pagination={{ page, totalCount: count, pageSize: 20, onPageChange: setPage }} />
      </div>

      <Modal open={viewOpen} onClose={() => setViewOpen(false)} title="Appointment Details" size="md">
        {selected && (
          <div className="space-y-2 text-sm">
            {[
              ["Dentist", `Dr. ${selected.dentist_details?.full_name}`],
              ["Service", selected.service_details?.name ?? "—"],
              ["Date", formatDate(selected.appointment_date)],
              ["Time", formatTime(selected.appointment_time)],
              ["Status", selected.status],
              ["Reason", selected.reason || "—"],
              ["Notes", selected.notes || "—"],
            ].map(([l, v]) => (
              <div key={l} className="flex gap-2">
                <span className="font-medium text-gray-500 w-20 flex-shrink-0">{l}:</span>
                <span className="text-gray-800">{v}</span>
              </div>
            ))}
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!cancelId} title="Cancel Appointment"
        message="Are you sure you want to cancel this appointment?"
        variant="danger" loading={cancelling}
        onConfirm={handleCancel} onCancel={() => setCancelId(null)} />
    </PageLayout>
  );
}
