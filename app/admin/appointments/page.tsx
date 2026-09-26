"use client";

import { useEffect, useState, useCallback } from "react";
import PageLayout from "@/components/PageLayout";
import DataTable from "@/components/DataTable";
import Modal from "@/components/Modal";
import ConfirmDialog from "@/components/ConfirmDialog";
import { FilterSelect } from "@/components/Filter";
import SearchBar from "@/components/SearchBar";
import { appointmentsAPI } from "@/lib/api";
import { formatDate, formatTime, getStatusColor, extractError } from "@/lib/utils";
import { useToast } from "@/components/Toast";

interface Appointment {
  id: string;
  patient_details: { full_name: string; email: string };
  dentist_details: { full_name: string; specialization: string };
  service_details: { name: string; price: string } | null;
  appointment_date: string;
  appointment_time: string;
  reason: string;
  status: string;
  notes: string;
  created_at: string;
}

const STATUSES = ["", "PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"];

export default function AdminAppointmentsPage() {
  const { showToast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  const [selected, setSelected] = useState<Appointment | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [notesInput, setNotesInput] = useState("");
  const [confirmAction, setConfirmAction] = useState<{ id: string; action: "CONFIRMED" | "COMPLETED" | "CANCELLED" } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await appointmentsAPI.getAll({ page, search: search || undefined, status: status || undefined });
      setAppointments(data.results ?? []);
      setCount(data.count ?? 0);
    } catch (err) {
      showToast(extractError(err), "error");
    } finally {
      setLoading(false);
    }
  }, [page, search, status, showToast]);

  useEffect(() => { load(); }, [load]);

  const handleStatusChange = async () => {
    if (!confirmAction) return;
    setActionLoading(true);
    try {
      await appointmentsAPI.patch(confirmAction.id, {
        status: confirmAction.action,
        notes: notesInput || undefined,
      });
      showToast(`Appointment ${confirmAction.action.toLowerCase()}.`, "success");
      setConfirmAction(null);
      setViewOpen(false);
      setNotesInput("");
      load();
    } catch (err) {
      showToast(extractError(err), "error");
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    { key: "patient", header: "Patient", render: (r: Appointment) => r.patient_details?.full_name ?? "—" },
    { key: "dentist", header: "Dentist", render: (r: Appointment) => `Dr. ${r.dentist_details?.full_name ?? "—"}` },
    { key: "service", header: "Service", render: (r: Appointment) => r.service_details?.name ?? "—" },
    { key: "appointment_date", header: "Date", render: (r: Appointment) => formatDate(r.appointment_date) },
    { key: "appointment_time", header: "Time", render: (r: Appointment) => formatTime(r.appointment_time) },
    {
      key: "status", header: "Status",
      render: (r: Appointment) => (
        <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getStatusColor(r.status)}`}>
          {r.status}
        </span>
      ),
    },
    {
      key: "actions", header: "Actions",
      render: (r: Appointment) => (
        <div className="flex gap-1">
          <button onClick={() => { setSelected(r); setNotesInput(r.notes); setViewOpen(true); }}
            className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100">View</button>
          {r.status === "PENDING" && (
            <button onClick={() => setConfirmAction({ id: r.id, action: "CONFIRMED" })}
              className="px-2 py-1 text-xs bg-green-50 text-green-700 rounded hover:bg-green-100">Confirm</button>
          )}
          {r.status === "CONFIRMED" && (
            <button onClick={() => setConfirmAction({ id: r.id, action: "COMPLETED" })}
              className="px-2 py-1 text-xs bg-purple-50 text-purple-700 rounded hover:bg-purple-100">Complete</button>
          )}
          {["PENDING", "CONFIRMED"].includes(r.status) && (
            <button onClick={() => setConfirmAction({ id: r.id, action: "CANCELLED" })}
              className="px-2 py-1 text-xs bg-red-50 text-red-700 rounded hover:bg-red-100">Cancel</button>
          )}
        </div>
      ),
    },
  ];

  return (
    <PageLayout title="Appointments">
      <div className="p-6">
        <div className="flex flex-wrap gap-3 mb-4">
          <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search patient, dentist…" />
          <FilterSelect placeholder="All Statuses" value={status} onChange={(v) => { setStatus(v); setPage(1); }}
            options={STATUSES.map((s) => ({ value: s, label: s || "All Statuses" }))} />
        </div>

        <DataTable columns={columns} data={appointments} loading={loading}
          pagination={{ page, totalCount: count, pageSize: 20, onPageChange: setPage }} />
      </div>

      {/* View modal */}
      <Modal open={viewOpen} onClose={() => setViewOpen(false)} title="Appointment Details" size="lg">
        {selected && (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div><span className="font-medium text-gray-500">Patient</span><p>{selected.patient_details?.full_name}</p></div>
              <div><span className="font-medium text-gray-500">Dentist</span><p>Dr. {selected.dentist_details?.full_name}</p></div>
              <div><span className="font-medium text-gray-500">Service</span><p>{selected.service_details?.name ?? "—"}</p></div>
              <div><span className="font-medium text-gray-500">Status</span>
                <span className={`ml-1 px-2 py-0.5 text-xs rounded-full border ${getStatusColor(selected.status)}`}>{selected.status}</span>
              </div>
              <div><span className="font-medium text-gray-500">Date</span><p>{formatDate(selected.appointment_date)}</p></div>
              <div><span className="font-medium text-gray-500">Time</span><p>{formatTime(selected.appointment_time)}</p></div>
            </div>
            <div><span className="font-medium text-gray-500">Reason</span><p className="mt-1">{selected.reason || "—"}</p></div>
            <div>
              <label className="font-medium text-gray-500 block mb-1">Notes</label>
              <textarea value={notesInput} onChange={(e) => setNotesInput(e.target.value)}
                rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex gap-2 pt-2">
              {selected.status === "PENDING" && (
                <button onClick={() => setConfirmAction({ id: selected.id, action: "CONFIRMED" })}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">Confirm</button>
              )}
              {selected.status === "CONFIRMED" && (
                <button onClick={() => setConfirmAction({ id: selected.id, action: "COMPLETED" })}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Complete</button>
              )}
              {["PENDING", "CONFIRMED"].includes(selected.status) && (
                <button onClick={() => setConfirmAction({ id: selected.id, action: "CANCELLED" })}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">Cancel</button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Confirm dialog */}
      <ConfirmDialog
        open={!!confirmAction}
        title={`${confirmAction?.action === "CANCELLED" ? "Cancel" : confirmAction?.action === "CONFIRMED" ? "Confirm" : "Complete"} Appointment`}
        message={`Are you sure you want to mark this appointment as ${confirmAction?.action?.toLowerCase()}?`}
        variant={confirmAction?.action === "CANCELLED" ? "danger" : "primary"}
        loading={actionLoading}
        onConfirm={handleStatusChange}
        onCancel={() => setConfirmAction(null)}
      />
    </PageLayout>
  );
}
