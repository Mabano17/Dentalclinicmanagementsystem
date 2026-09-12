"use client";

import { useEffect, useState, useCallback } from "react";
import { FiCheck, FiX, FiEye, FiCheckCircle } from "react-icons/fi";
import PageLayout from "@/components/PageLayout";
import AuthGuard from "@/components/AuthGuard";
import DataTable, { Column } from "@/components/DataTable";
import SearchBar from "@/components/SearchBar";
import { FilterSelect } from "@/components/Filter";
import Modal from "@/components/Modal";
import ConfirmDialog from "@/components/ConfirmDialog";
import ErrorMessage from "@/components/ErrorMessage";
import { useToast } from "@/components/Toast";
import { appointmentsAPI } from "@/lib/api";
import { formatDate, formatTime, getStatusColor, extractError } from "@/lib/utils";

interface Appointment {
  id: number;
  patient_name: string;
  dentist_name: string;
  service_name: string;
  date: string;
  time: string;
  status: string;
  reason: string;
}

const STATUS_OPTS = [
  { label: "All Statuses", value: "" },
  { label: "Pending", value: "pending" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
];

export default function AdminAppointmentsPage() {
  const { showToast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [viewModal, setViewModal] = useState(false);
  const [actionModal, setActionModal] = useState<{ type: "confirm" | "complete" | "cancel"; appt: Appointment } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const params: Record<string, unknown> = { page };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (dateFilter) params.date = dateFilter;
      const { data } = await appointmentsAPI.getAll(params);
      setAppointments(data.results ?? data);
      setTotalPages(data.total_pages ?? 1);
      setTotalCount(data.count ?? (data.results ?? data).length);
    } catch (err) { setError(extractError(err)); }
    finally { setLoading(false); }
  }, [page, search, statusFilter, dateFilter]);

  useEffect(() => { fetch(); }, [fetch]);

  const handleAction = async () => {
    if (!actionModal) return;
    setActionLoading(true);
    try {
      const { type, appt } = actionModal;
      if (type === "confirm") await appointmentsAPI.confirm(appt.id);
      else if (type === "complete") await appointmentsAPI.complete(appt.id);
      else await appointmentsAPI.cancel(appt.id);
      showToast(`Appointment ${type}ed.`, "success");
      setActionModal(null);
      fetch();
    } catch (err) { showToast(extractError(err), "error"); }
    finally { setActionLoading(false); }
  };

  const columns: Column<Appointment>[] = [
    { key: "id", header: "ID", render: (r) => <span className="text-gray-400 text-xs">#{r.id}</span> },
    { key: "patient_name", header: "Patient", render: (r) => <span className="font-medium">{r.patient_name}</span> },
    { key: "dentist_name", header: "Dentist", render: (r) => `Dr. ${r.dentist_name}` },
    { key: "service_name", header: "Service" },
    { key: "date", header: "Date", render: (r) => formatDate(r.date) },
    { key: "time", header: "Time", render: (r) => formatTime(r.time) },
    { key: "status", header: "Status", render: (r) => <span className={`badge ${getStatusColor(r.status)}`}>{r.status}</span> },
    {
      key: "actions", header: "Actions",
      render: (r) => (
        <div className="flex items-center gap-1">
          <button onClick={() => { setSelected(r); setViewModal(true); }} className="btn-secondary btn-sm p-1.5" title="View">
            <FiEye className="w-3.5 h-3.5" />
          </button>
          {r.status === "pending" && (
            <button onClick={() => setActionModal({ type: "confirm", appt: r })} className="btn-success btn-sm p-1.5" title="Confirm">
              <FiCheck className="w-3.5 h-3.5" />
            </button>
          )}
          {r.status === "confirmed" && (
            <button onClick={() => setActionModal({ type: "complete", appt: r })} className="btn-primary btn-sm p-1.5" title="Complete">
              <FiCheckCircle className="w-3.5 h-3.5" />
            </button>
          )}
          {(r.status === "pending" || r.status === "confirmed") && (
            <button onClick={() => setActionModal({ type: "cancel", appt: r })} className="btn-danger btn-sm p-1.5" title="Cancel">
              <FiX className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <AuthGuard requiredRole="admin">
      <PageLayout role="admin" title="Appointments">
        <div className="page-header">
          <div><h2 className="page-title">Appointments</h2><p className="page-subtitle">Manage and update all clinic appointments.</p></div>
        </div>

        <div className="card mb-5">
          <div className="flex flex-col sm:flex-row gap-3">
            <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search by patient or dentist…" className="flex-1" />
            <FilterSelect value={statusFilter} options={STATUS_OPTS} onChange={(v) => { setStatusFilter(v); setPage(1); }} className="w-44" />
            <div className="form-group">
              <input type="date" value={dateFilter} onChange={(e) => { setDateFilter(e.target.value); setPage(1); }}
                className="input h-10" title="Filter by date" />
            </div>
            {(search || statusFilter || dateFilter) && (
              <button onClick={() => { setSearch(""); setStatusFilter(""); setDateFilter(""); setPage(1); }} className="btn-secondary btn-sm h-10">
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {error ? <ErrorMessage message={error} onRetry={fetch} /> : (
          <div className="card">
            <DataTable columns={columns} data={appointments} loading={loading} keyExtractor={(r) => r.id}
              page={page} totalPages={totalPages} totalCount={totalCount} onPageChange={setPage} emptyMessage="No appointments found." />
          </div>
        )}

        {/* View Modal */}
        <Modal isOpen={viewModal} onClose={() => setViewModal(false)} title={`Appointment #${selected?.id}`}>
          {selected && (
            <div className="grid grid-cols-2 gap-4">
              {[
                ["Patient", selected.patient_name],
                ["Dentist", `Dr. ${selected.dentist_name}`],
                ["Service", selected.service_name],
                ["Date", formatDate(selected.date)],
                ["Time", formatTime(selected.time)],
                ["Reason", selected.reason || "—"],
              ].map(([l, v]) => (
                <div key={l}>
                  <p className="text-xs text-gray-400 mb-0.5">{l}</p>
                  <p className="text-sm font-medium">{v}</p>
                </div>
              ))}
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Status</p>
                <span className={`badge ${getStatusColor(selected.status)}`}>{selected.status}</span>
              </div>
            </div>
          )}
        </Modal>

        {/* Action confirm dialog */}
        <ConfirmDialog
          isOpen={!!actionModal}
          onClose={() => setActionModal(null)}
          onConfirm={handleAction}
          title={
            actionModal?.type === "confirm" ? "Confirm Appointment" :
            actionModal?.type === "complete" ? "Mark as Completed" : "Cancel Appointment"
          }
          message={
            actionModal?.type === "cancel"
              ? `Cancel appointment #${actionModal?.appt.id} for ${actionModal?.appt.patient_name}?`
              : `Proceed to ${actionModal?.type} appointment #${actionModal?.appt.id}?`
          }
          confirmLabel={actionModal?.type === "cancel" ? "Yes, Cancel" : "Confirm"}
          confirmVariant={actionModal?.type === "cancel" ? "danger" : "primary"}
          loading={actionLoading}
        />
      </PageLayout>
    </AuthGuard>
  );
}
