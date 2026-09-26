"use client";

import { useEffect, useState, useCallback } from "react";
import PageLayout from "@/components/PageLayout";
import DataTable from "@/components/DataTable";
import Modal from "@/components/Modal";
import ConfirmDialog from "@/components/ConfirmDialog";
import SearchBar from "@/components/SearchBar";
import { FilterSelect } from "@/components/Filter";
import { paymentsAPI, patientsAPI } from "@/lib/api";
import { formatDate, formatCurrency, getStatusColor, extractError } from "@/lib/utils";
import { useToast } from "@/components/Toast";

interface Payment {
  id: string;
  patient: string;
  patient_details: { full_name: string; email: string };
  appointment: string | null;
  amount: string;
  payment_date: string | null;
  payment_method: string;
  payment_status: string;
  reference_number: string | null;
  notes: string;
  created_at: string;
}

interface SelectOption { id: string; full_name: string }

const blank = (): Partial<Payment> => ({
  patient: "", appointment: null, amount: "",
  payment_date: "", payment_method: "CASH", payment_status: "PENDING",
  reference_number: "", notes: "",
});

const METHODS = ["CASH", "GCASH", "BANK_TRANSFER", "OTHER"];
const STATUSES = ["PENDING", "PAID", "CANCELLED"];

export default function AdminPaymentsPage() {
  const { showToast } = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [methodFilter, setMethodFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"add" | "edit" | "view" | null>(null);
  const [selected, setSelected] = useState<Payment | null>(null);
  const [form, setForm] = useState<Partial<Payment>>(blank());
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [patients, setPatients] = useState<SelectOption[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await paymentsAPI.getAll({
        page,
        search: search || undefined,
        payment_status: statusFilter || undefined,
        payment_method: methodFilter || undefined,
      });
      setPayments(data.results ?? []);
      setCount(data.count ?? 0);
    } catch (err) { showToast(extractError(err), "error"); }
    finally { setLoading(false); }
  }, [page, search, statusFilter, methodFilter, showToast]);

  useEffect(() => { load(); }, [load]);

  const loadPatients = async () => {
    try {
      const { data } = await patientsAPI.getAll({ page_size: 200 });
      setPatients(data.results ?? []);
    } catch { /* ignore */ }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...form, reference_number: form.reference_number || null };
      if (mode === "add") { await paymentsAPI.create(payload); showToast("Payment created.", "success"); }
      else if (mode === "edit" && selected) { await paymentsAPI.patch(selected.id, payload); showToast("Payment updated.", "success"); }
      setMode(null); load();
    } catch (err) { showToast(extractError(err), "error"); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await paymentsAPI.delete(deleteId);
      showToast("Payment deleted.", "success");
      setDeleteId(null); load();
    } catch (err) { showToast(extractError(err), "error"); }
    finally { setDeleting(false); }
  };

  const f = (k: keyof Payment) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((p) => ({ ...p, [k]: e.target.value }));

  const methodLabel: Record<string, string> = {
    CASH: "Cash", GCASH: "GCash", BANK_TRANSFER: "Bank Transfer", OTHER: "Other",
  };

  const columns = [
    { key: "patient", header: "Patient", render: (r: Payment) => r.patient_details?.full_name ?? "—" },
    { key: "amount", header: "Amount", render: (r: Payment) => formatCurrency(r.amount) },
    { key: "payment_method", header: "Method", render: (r: Payment) => methodLabel[r.payment_method] ?? r.payment_method },
    { key: "payment_date", header: "Date", render: (r: Payment) => formatDate(r.payment_date ?? "") },
    {
      key: "payment_status", header: "Status",
      render: (r: Payment) => (
        <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getStatusColor(r.payment_status)}`}>
          {r.payment_status}
        </span>
      ),
    },
    { key: "reference_number", header: "Reference", render: (r: Payment) => r.reference_number ?? "—" },
    {
      key: "actions", header: "Actions",
      render: (r: Payment) => (
        <div className="flex gap-1">
          <button onClick={() => { setSelected(r); setMode("view"); }} className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100">View</button>
          <button onClick={() => { setSelected(r); setForm({ ...r }); loadPatients(); setMode("edit"); }} className="px-2 py-1 text-xs bg-yellow-50 text-yellow-700 rounded hover:bg-yellow-100">Edit</button>
          <button onClick={() => setDeleteId(r.id)} className="px-2 py-1 text-xs bg-red-50 text-red-700 rounded hover:bg-red-100">Delete</button>
        </div>
      ),
    },
  ];

  return (
    <PageLayout title="Payments">
      <div className="p-6">
        <div className="flex flex-wrap gap-3 mb-4 justify-between">
          <div className="flex flex-wrap gap-3">
            <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search patient, reference…" />
            <FilterSelect label="Status" value={statusFilter} onChange={(v) => { setStatusFilter(v); setPage(1); }}
              options={[{ value: "", label: "All Status" }, ...STATUSES.map((s) => ({ value: s, label: s }))]} />
            <FilterSelect label="Method" value={methodFilter} onChange={(v) => { setMethodFilter(v); setPage(1); }}
              options={[{ value: "", label: "All Methods" }, ...METHODS.map((m) => ({ value: m, label: methodLabel[m] }))]} />
          </div>
          <button onClick={() => { setForm(blank()); loadPatients(); setMode("add"); }}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">+ Add Payment</button>
        </div>
        <DataTable columns={columns} data={payments} loading={loading}
          pagination={{ page, totalCount: count, pageSize: 20, onPageChange: setPage }} />
      </div>

      <Modal open={!!mode} onClose={() => setMode(null)}
        title={mode === "view" ? "Payment Details" : mode === "add" ? "Add Payment" : "Edit Payment"} size="md">
        {mode === "view" && selected ? (
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              ["Patient", selected.patient_details?.full_name],
              ["Amount", formatCurrency(selected.amount)],
              ["Method", methodLabel[selected.payment_method] ?? selected.payment_method],
              ["Status", selected.payment_status],
              ["Payment Date", formatDate(selected.payment_date ?? "")],
              ["Reference #", selected.reference_number ?? "—"],
              ["Notes", selected.notes || "—"],
            ].map(([l, v]) => <div key={l}><p className="text-gray-500 font-medium">{l}</p><p className="mt-0.5">{v}</p></div>)}
          </div>
        ) : (
          <div className="space-y-3 text-sm">
            <div>
              <label className="block font-medium text-gray-700 mb-1">Patient</label>
              <select value={form.patient ?? ""} onChange={f("patient")}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select patient…</option>
                {patients.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-gray-700 mb-1">Amount (₱)</label>
                <input type="number" min="0" step="0.01" value={form.amount ?? ""} onChange={f("amount")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1">Payment Date</label>
                <input type="date" value={form.payment_date ?? ""} onChange={f("payment_date")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1">Method</label>
                <select value={form.payment_method ?? "CASH"} onChange={f("payment_method")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {METHODS.map((m) => <option key={m} value={m}>{methodLabel[m]}</option>)}
                </select>
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1">Status</label>
                <select value={form.payment_status ?? "PENDING"} onChange={f("payment_status")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block font-medium text-gray-700 mb-1">Reference Number</label>
              <input type="text" value={form.reference_number ?? ""} onChange={f("reference_number")}
                placeholder="Optional"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block font-medium text-gray-700 mb-1">Notes</label>
              <textarea rows={2} value={form.notes ?? ""} onChange={f("notes")}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setMode(null)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:bg-blue-300">
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!deleteId} title="Delete Payment" message="Delete this payment record permanently?"
        variant="danger" loading={deleting} onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
    </PageLayout>
  );
}
