"use client";

import { useEffect, useState, useCallback } from "react";
import PageLayout from "@/components/PageLayout";
import AuthGuard from "@/components/AuthGuard";
import DataTable from "@/components/DataTable";
import Modal from "@/components/Modal";
import ConfirmDialog from "@/components/ConfirmDialog";
import { FilterSelect } from "@/components/Filter";
import { appointmentsAPI } from "@/lib/api";
import { formatDate, formatTime, getStatusColor, extractError } from "@/lib/utils";
import { useToast } from "@/components/Toast";

interface Appointment {
  id: string;
  patient_details: { full_name: string; email: string };
  service_details: { name: string; price: string } | null;
  appointment_date: string;
  appointment_time: string;
  reason: string;
  status: string;
  notes: string;
}

function DentistAppointmentsPage() {
  const { showToast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [notesInput, setNotesInput] = useState("");
  const [confirmAction, setConfirmAction] = useState<{ id: string; action: "CONFIRMED" | "COMPLETED" | "CANCELLED" } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await appointmentsAPI.getAll({ page, status: statusFilter || undefined });
      setAppointments(data.results ?? []);
      setCount(data.count ?? 0);
    } catch (err) { showToast(extractError(err), "error"); }
    finally { setLoading(false); }
  }, [page, statusFilter, showToast]);

  useEffect(() => { load(); }, [load]);

  const handleAction = async () => {
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
    } catch (err) { showToast(extractError(err), "error"); }
    finally { setActionLoading(false); }
  };

  const columns = [
    { key: "patient", header: "Patient", render: (r: Appointment) => r.patient_details?.full_name ?? "—" },
    { key: "service", header: "Service", render: (r: Appointment) => r.service_details?.name ?? "General Consultation" },
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
    <AuthGuard role="DENTIST">
      <PageLayout title="My Appointments">
      <div className="p-6">
        <div className="flex gap-3 mb-4">
          <FilterSelect label="Status" value={statusFilter} onChange={(v) => { setStatusFilter(v); setPage(1); }}
            options={[
              { value: "", label: "All" },
              { value: "PENDING", label: "Pending" },
              { value: "CONFIRMED", label: "Confirmed" },
              { value: "COMPLETED", label: "Completed" },
              { value: "CANCELLED", label: "Cancelled" },
            ]} />
        </div>
        <DataTable columns={columns} data={appointments} loading={loading}
          pagination={{ page, totalCount: count, pageSize: 20, onPageChange: setPage }} />
      </div>

      <Modal open={viewOpen} onClose={() => setViewOpen(false)} title="Appointment Details" size="md">
        {selected && (
          <div className="space-y-3 text-sm">
            {[
              ["Patient", selected.patient_details?.full_name],
              ["Service", selected.service_details?.name ?? "General Consultation"],
              ["Date", formatDate(selected.appointment_date)],
              ["Time", formatTime(selected.appointment_time)],
              ["Status", selected.status],
              ["Reason", selected.reason || "—"],
            ].map(([l, v]) => (
              <div key={l} className="flex gap-2">
                <span className="font-medium text-gray-500 w-20 flex-shrink-0">{l}:</span>
                <span className="text-gray-800">{v}</span>
              </div>
            ))}
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

      <ConfirmDialog
        open={!!confirmAction}
        title={`${confirmAction?.action === "CANCELLED" ? "Cancel" : confirmAction?.action === "CONFIRMED" ? "Confirm" : "Complete"} Appointment`}
        message={`Are you sure you want to mark this appointment as ${confirmAction?.action?.toLowerCase()}?`}
        variant={confirmAction?.action === "CANCELLED" ? "danger" : "primary"}
        loading={actionLoading}
        onConfirm={handleAction}
        onCancel={() => setConfirmAction(null)}
      />
      </PageLayout>
    </AuthGuard>
  );
}

export default DentistAppointmentsPage;
