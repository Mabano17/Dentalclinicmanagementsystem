"use client";

import { useEffect, useState, useCallback } from "react";
import { FiDollarSign, FiEye } from "react-icons/fi";
import PageLayout from "@/components/PageLayout";
import AuthGuard from "@/components/AuthGuard";
import DataTable, { Column } from "@/components/DataTable";
import SearchBar from "@/components/SearchBar";
import { FilterSelect } from "@/components/Filter";
import Modal from "@/components/Modal";
import ErrorMessage from "@/components/ErrorMessage";
import { paymentsAPI } from "@/lib/api";
import { formatDate, formatCurrency, getStatusColor, paymentMethodLabel, extractError } from "@/lib/utils";

interface Payment {
  id: number;
  appointment_id: number;
  appointment_info?: string;
  amount: string | number;
  payment_date: string;
  payment_method: string;
  status: string;
  reference_number: string;
}

const STATUS_OPTIONS = [
  { label: "All Statuses", value: "" },
  { label: "Paid", value: "paid" },
  { label: "Unpaid", value: "unpaid" },
  { label: "Partial", value: "partial" },
];

const METHOD_OPTIONS = [
  { label: "All Methods", value: "" },
  { label: "Cash", value: "cash" },
  { label: "GCash", value: "gcash" },
  { label: "Maya", value: "maya" },
  { label: "Bank Transfer", value: "bank_transfer" },
  { label: "Credit Card", value: "credit_card" },
];

export default function PatientPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [methodFilter, setMethodFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selected, setSelected] = useState<Payment | null>(null);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, unknown> = { page };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (methodFilter) params.payment_method = methodFilter;
      const { data } = await paymentsAPI.getAll(params);
      setPayments(data.results ?? data);
      setTotalPages(data.total_pages ?? 1);
      setTotalCount(data.count ?? (data.results ?? data).length);
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, methodFilter]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  const totalPaid = payments
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const columns: Column<Payment>[] = [
    { key: "id", header: "ID", render: (r) => <span className="text-gray-400 text-xs">#{r.id}</span> },
    {
      key: "appointment_id",
      header: "Appointment",
      render: (r) => <span className="text-gray-600">Appt #{r.appointment_id}</span>,
    },
    { key: "amount", header: "Amount", render: (r) => <span className="font-semibold">{formatCurrency(Number(r.amount))}</span> },
    { key: "payment_date", header: "Date", render: (r) => formatDate(r.payment_date) },
    { key: "payment_method", header: "Method", render: (r) => paymentMethodLabel(r.payment_method) },
    {
      key: "status",
      header: "Status",
      render: (r) => <span className={`badge ${getStatusColor(r.status)}`}>{r.status}</span>,
    },
    {
      key: "reference_number",
      header: "Reference",
      render: (r) => <span className="font-mono text-xs">{r.reference_number || "—"}</span>,
    },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <button onClick={() => setSelected(r)} className="btn-secondary btn-sm">
          <FiEye className="w-3.5 h-3.5" />
        </button>
      ),
    },
  ];

  return (
    <AuthGuard requiredRole="patient">
      <PageLayout role="patient" title="My Payments">
        <div className="page-header">
          <div>
            <h2 className="page-title">My Payments</h2>
            <p className="page-subtitle">Track your payment history and billing records.</p>
          </div>
          {/* Summary */}
          <div className="hidden sm:flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-2.5">
            <FiDollarSign className="w-4 h-4 text-green-600" />
            <div>
              <p className="text-xs text-green-600">Total Paid (this view)</p>
              <p className="text-sm font-bold text-green-800">{formatCurrency(totalPaid)}</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card mb-5">
          <div className="flex flex-col sm:flex-row gap-3">
            <SearchBar
              value={search}
              onChange={(v) => { setSearch(v); setPage(1); }}
              placeholder="Search payments…"
              className="flex-1"
            />
            <FilterSelect
              value={statusFilter}
              options={STATUS_OPTIONS}
              onChange={(v) => { setStatusFilter(v); setPage(1); }}
              placeholder="All Statuses"
              className="w-40"
            />
            <FilterSelect
              value={methodFilter}
              options={METHOD_OPTIONS}
              onChange={(v) => { setMethodFilter(v); setPage(1); }}
              placeholder="All Methods"
              className="w-44"
            />
          </div>
        </div>

        {error ? (
          <ErrorMessage message={error} onRetry={fetchPayments} />
        ) : (
          <div className="card">
            <DataTable
              columns={columns}
              data={payments}
              loading={loading}
              keyExtractor={(r) => r.id}
              page={page}
              totalPages={totalPages}
              totalCount={totalCount}
              onPageChange={setPage}
              emptyMessage="No payment records found."
            />
          </div>
        )}

        {/* Payment detail modal */}
        <Modal
          isOpen={!!selected}
          onClose={() => setSelected(null)}
          title={`Payment #${selected?.id}`}
        >
          {selected && (
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Amount", value: formatCurrency(Number(selected.amount)) },
                { label: "Status", value: selected.status },
                { label: "Date", value: formatDate(selected.payment_date) },
                { label: "Method", value: paymentMethodLabel(selected.payment_method) },
                { label: "Appointment", value: `#${selected.appointment_id}` },
                { label: "Reference No.", value: selected.reference_number || "—" },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                  {label === "Status" ? (
                    <span className={`badge ${getStatusColor(value)}`}>{value}</span>
                  ) : label === "Amount" ? (
                    <p className="text-sm font-bold text-green-700">{value}</p>
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
