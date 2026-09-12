"use client";

import { useEffect, useState, useCallback } from "react";
import { FiPlus, FiEdit2, FiTrash2, FiEye } from "react-icons/fi";
import PageLayout from "@/components/PageLayout";
import AuthGuard from "@/components/AuthGuard";
import DataTable, { Column } from "@/components/DataTable";
import SearchBar from "@/components/SearchBar";
import { FilterSelect } from "@/components/Filter";
import Modal from "@/components/Modal";
import ConfirmDialog from "@/components/ConfirmDialog";
import ErrorMessage from "@/components/ErrorMessage";
import { useToast } from "@/components/Toast";
import { paymentsAPI, appointmentsAPI } from "@/lib/api";
import { formatDate, formatCurrency, getStatusColor, paymentMethodLabel, extractError } from "@/lib/utils";

interface Payment {
  id: number;
  appointment: number;
  appointment_info?: string;
  patient_name?: string;
  amount: string | number;
  payment_date: string;
  payment_method: string;
  status: string;
  reference_number: string;
}

interface ApptOption { id: number; label: string; }

const EMPTY = { appointment: 0, amount: "", payment_date: "", payment_method: "cash", status: "paid", reference_number: "" };

const STATUS_OPTS = [{ label: "All", value: "" }, { label: "Paid", value: "paid" }, { label: "Unpaid", value: "unpaid" }, { label: "Partial", value: "partial" }];
const METHOD_OPTS = [
  { label: "All Methods", value: "" }, { label: "Cash", value: "cash" }, { label: "GCash", value: "gcash" },
  { label: "Maya", value: "maya" }, { label: "Bank Transfer", value: "bank_transfer" },
  { label: "Credit Card", value: "credit_card" }, { label: "Debit Card", value: "debit_card" },
];
const METHOD_FORM_OPTS = METHOD_OPTS.slice(1);

export default function AdminPaymentsPage() {
  const { showToast } = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [methodFilter, setMethodFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [modalMode, setModalMode] = useState<"add" | "edit" | "view" | null>(null);
  const [selected, setSelected] = useState<Payment | null>(null);
  const [form, setForm] = useState<typeof EMPTY>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Payment | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [apptOptions, setApptOptions] = useState<ApptOption[]>([]);

  useEffect(() => {
    appointmentsAPI.getAll({ page_size: 200, status: "confirmed" }).then(({ data }) => {
      const list = data.results ?? data;
      setApptOptions(list.map((a: { id: number; patient_name: string; service_name: string }) => ({
        id: a.id, label: `#${a.id} — ${a.patient_name} (${a.service_name})`,
      })));
    }).catch(() => {});
  }, []);

  const fetch = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const params: Record<string, unknown> = { page };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (methodFilter) params.payment_method = methodFilter;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      const { data } = await paymentsAPI.getAll(params);
      setPayments(data.results ?? data);
      setTotalPages(data.total_pages ?? 1);
      setTotalCount(data.count ?? (data.results ?? data).length);
    } catch (err) { setError(extractError(err)); }
    finally { setLoading(false); }
  }, [page, search, statusFilter, methodFilter, dateFrom, dateTo]);

  useEffect(() => { fetch(); }, [fetch]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (modalMode === "add") { await paymentsAPI.create(form); showToast("Payment recorded.", "success"); }
      else if (modalMode === "edit" && selected) { await paymentsAPI.update(selected.id, form); showToast("Payment updated.", "success"); }
      setModalMode(null); fetch();
    } catch (err) { showToast(extractError(err), "error"); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await paymentsAPI.delete(deleteTarget.id);
      showToast("Payment deleted.", "success");
      setDeleteTarget(null); fetch();
    } catch (err) { showToast(extractError(err), "error"); }
    finally { setDeleting(false); }
  };

  const totalRevenue = payments.filter((p) => p.status === "paid").reduce((s, p) => s + Number(p.amount), 0);

  const columns: Column<Payment>[] = [
    { key: "id", header: "ID", render: (r) => <span className="text-xs text-gray-400">#{r.id}</span> },
    { key: "patient_name", header: "Patient", render: (r) => <span className="font-medium">{r.patient_name ?? "—"}</span> },
    { key: "appointment", header: "Appt #", render: (r) => <span className="text-gray-500">#{r.appointment}</span> },
    { key: "amount", header: "Amount", render: (r) => <span className="font-semibold text-green-700">{formatCurrency(Number(r.amount))}</span> },
    { key: "payment_date", header: "Date", render: (r) => formatDate(r.payment_date) },
    { key: "payment_method", header: "Method", render: (r) => paymentMethodLabel(r.payment_method) },
    { key: "status", header: "Status", render: (r) => <span className={`badge ${getStatusColor(r.status)}`}>{r.status}</span> },
    {
      key: "actions", header: "Actions",
      render: (r) => (
        <div className="flex gap-1">
          <button onClick={() => { setSelected(r); setModalMode("view"); }} className="btn-secondary btn-sm p-1.5"><FiEye className="w-3.5 h-3.5" /></button>
          <button onClick={() => { setForm({ appointment: r.appointment, amount: String(r.amount), payment_date: r.payment_date, payment_method: r.payment_method, status: r.status, reference_number: r.reference_number }); setSelected(r); setModalMode("edit"); }} className="btn-secondary btn-sm p-1.5"><FiEdit2 className="w-3.5 h-3.5" /></button>
          <button onClick={() => setDeleteTarget(r)} className="btn-danger btn-sm p-1.5"><FiTrash2 className="w-3.5 h-3.5" /></button>
        </div>
      ),
    },
  ];

  const PaymentForm = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="form-group sm:col-span-2">
        <label className="label">Appointment</label>
        <select value={form.appointment} onChange={(e) => setForm((p) => ({ ...p, appointment: Number(e.target.value) }))} className="input">
          <option value={0}>Select appointment</option>
          {apptOptions.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
        </select>
      </div>
      <div className="form-group">
        <label className="label">Amount (₱)</label>
        <input type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))} className="input" placeholder="0.00" />
      </div>
      <div className="form-group">
        <label className="label">Payment Date</label>
        <input type="date" value={form.payment_date} onChange={(e) => setForm((p) => ({ ...p, payment_date: e.target.value }))} className="input" />
      </div>
      <div className="form-group">
        <label className="label">Payment Method</label>
        <select value={form.payment_method} onChange={(e) => setForm((p) => ({ ...p, payment_method: e.target.value }))} className="input">
          {METHOD_FORM_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
      <div className="form-group">
        <label className="label">Status</label>
        <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))} className="input">
          <option value="paid">Paid</option>
          <option value="unpaid">Unpaid</option>
          <option value="partial">Partial</option>
        </select>
      </div>
      <div className="form-group sm:col-span-2">
        <label className="label">Reference Number</label>
        <input type="text" value={form.reference_number} onChange={(e) => setForm((p) => ({ ...p, reference_number: e.target.value }))} className="input" placeholder="Optional" />
      </div>
    </div>
  );

  return (
    <AuthGuard requiredRole="admin">
      <PageLayout role="admin" title="Payments">
        <div className="page-header">
          <div><h2 className="page-title">Payments</h2><p className="page-subtitle">Manage billing and payment records.</p></div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-xs text-gray-400">Filtered Revenue</p>
              <p className="text-sm font-bold text-green-700">{formatCurrency(totalRevenue)}</p>
            </div>
            <button onClick={() => { setForm(EMPTY); setSelected(null); setModalMode("add"); }} className="btn-primary">
              <FiPlus className="w-4 h-4" /> Record Payment
            </button>
          </div>
        </div>

        <div className="card mb-5">
          <div className="flex flex-wrap gap-3">
            <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search payments…" className="flex-1 min-w-48" />
            <FilterSelect value={statusFilter} options={STATUS_OPTS} onChange={(v) => { setStatusFilter(v); setPage(1); }} className="w-36" />
            <FilterSelect value={methodFilter} options={METHOD_OPTS} onChange={(v) => { setMethodFilter(v); setPage(1); }} className="w-44" />
            <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} className="input h-10 w-40" title="From date" />
            <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} className="input h-10 w-40" title="To date" />
          </div>
        </div>

        {error ? <ErrorMessage message={error} onRetry={fetch} /> : (
          <div className="card">
            <DataTable columns={columns} data={payments} loading={loading} keyExtractor={(r) => r.id}
              page={page} totalPages={totalPages} totalCount={totalCount} onPageChange={setPage} emptyMessage="No payments found." />
          </div>
        )}

        <Modal isOpen={modalMode === "add" || modalMode === "edit"} onClose={() => setModalMode(null)}
          title={modalMode === "add" ? "Record Payment" : "Edit Payment"} size="lg"
          footer={<><button onClick={() => setModalMode(null)} className="btn-secondary">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Save"}
            </button></>}>
          <PaymentForm />
        </Modal>

        <Modal isOpen={modalMode === "view"} onClose={() => setModalMode(null)} title={`Payment #${selected?.id}`}>
          {selected && (
            <div className="grid grid-cols-2 gap-4">
              {[["Patient",selected.patient_name??"-"],["Appointment",`#${selected.appointment}`],
                ["Amount",formatCurrency(Number(selected.amount))],["Date",formatDate(selected.payment_date)],
                ["Method",paymentMethodLabel(selected.payment_method)],["Reference",selected.reference_number||"—"]].map(([l,v])=>(
                <div key={l}><p className="text-xs text-gray-400 mb-0.5">{l}</p><p className="text-sm font-medium">{v}</p></div>
              ))}
              <div><p className="text-xs text-gray-400 mb-0.5">Status</p>
                <span className={`badge ${getStatusColor(selected.status)}`}>{selected.status}</span></div>
            </div>
          )}
        </Modal>

        <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
          title="Delete Payment" message={`Delete payment #${deleteTarget?.id}? This cannot be undone.`} loading={deleting} />
      </PageLayout>
    </AuthGuard>
  );
}
