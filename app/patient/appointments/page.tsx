"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { FiPlus, FiEye } from "react-icons/fi";
import PageLayout from "@/components/PageLayout";
import AuthGuard from "@/components/AuthGuard";
import DataTable, { Column } from "@/components/DataTable";
import SearchBar from "@/components/SearchBar";
import { FilterSelect } from "@/components/Filter";
import Modal from "@/components/Modal";
import ErrorMessage from "@/components/ErrorMessage";
import { useToast } from "@/components/Toast";
import { appointmentsAPI } from "@/lib/api";
import { formatDate, formatTime, getStatusColor, extractError } from "@/lib/utils";

interface Appointment {
  id: number;
  dentist_name: string;
  service_name: string;
  date: string;
  time: string;
  status: string;
  reason: string;
}

const STATUS_OPTIONS = [
  { label: "All Statuses", value: "" },
  { label: "Pending", value: "pending" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
];

export default function PatientAppointmentsPage() {
  const { showToast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selected, setSelected] = useState<Appointment | null>(null);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, unknown> = { page };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const { data } = await appointmentsAPI.getAll(params);
      setAppointments(data.results ?? data);
      setTotalPages(data.total_pages ?? 1);
      setTotalCount(data.count ?? (data.results ?? data).length);
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  const handleCancel = async (id: number) => {
    try {
      await appointmentsAPI.cancel(id);
      showToast("Appointment cancelled.", "success");
      fetchAppointments();
      setSelected(null);
    } catch (err) {
      showToast(extractError(err), "error");
    }
  };

  const columns: Column<Appointment>[] = [
    { key: "id", header: "ID", render: (row) => <span className="text-gray-400 text-xs">#{row.id}</span> },
    { key: "service_name", header: "Service", render: (row) => <span className="font-medium">{row.service_name}</span> },
    { key: "dentist_name", header: "Dentist", render: (row) => `Dr. ${row.dentist_name}` },
    { key: "date", header: "Date", render: (row) => formatDate(row.date) },
    { key: "time", header: "Time", render: (row) => formatTime(row.time) },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <span className={`badge ${getStatusColor(row.status)}`}>{row.status}</span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <button
          onClick={() => setSelected(row)}
          className="btn-secondary btn-sm"
        >
          <FiEye className="w-3.5 h-3.5" /> View
        </button>
      ),
    },
  ];

  return (
    <AuthGuard requiredRole="patient">
      <PageLayout role="patient" title="My Appointments">
        <div className="page-header">
          <div>
            <h2 className="page-title">My Appointments</h2>
            <p className="page-subtitle">Track your dental appointment history and status.</p>
          </div>
          <Link href="/patient/book-appointment" className="btn-primary">
            <FiPlus className="w-4 h-4" /> Book Appointment
          </Link>
        </div>

        {/* Filters */}
        <div className="card mb-5">
          <div className="flex flex-col sm:flex-row gap-3">
            <SearchBar
              value={search}
              onChange={(v) => { setSearch(v); setPage(1); }}
              placeholder="Search by service or dentist…"
              className="flex-1"
            />
            <FilterSelect
              value={statusFilter}
              options={STATUS_OPTIONS}
              onChange={(v) => { setStatusFilter(v); setPage(1); }}
              placeholder="All Statuses"
              className="w-44"
            />
          </div>
        </div>

        {error ? (
          <ErrorMessage message={error} onRetry={fetchAppointments} />
        ) : (
          <div className="card">
            <DataTable
              columns={columns}
              data={appointments}
              loading={loading}
              keyExtractor={(row) => row.id}
              page={page}
              totalPages={totalPages}
              totalCount={totalCount}
              onPageChange={setPage}
              emptyMessage="No appointments found."
            />
          </div>
        )}

        {/* Detail Modal */}
        <Modal
          isOpen={!!selected}
          onClose={() => setSelected(null)}
          title={`Appointment #${selected?.id}`}
          footer={
            selected?.status === "pending" || selected?.status === "confirmed" ? (
              <button
                onClick={() => selected && handleCancel(selected.id)}
                className="btn-danger"
              >
                Cancel Appointment
              </button>
            ) : undefined
          }
        >
          {selected && (
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Service", value: selected.service_name },
                { label: "Dentist", value: `Dr. ${selected.dentist_name}` },
                { label: "Date", value: formatDate(selected.date) },
                { label: "Time", value: formatTime(selected.time) },
                { label: "Status", value: selected.status },
                { label: "Reason", value: selected.reason || "—" },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                  {label === "Status" ? (
                    <span className={`badge ${getStatusColor(value)}`}>{value}</span>
                  ) : (
                    <p className="text-sm font-medium text-gray-900">{value}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </Modal>
      </PageLayout>
    </AuthGuard>
  );
}
