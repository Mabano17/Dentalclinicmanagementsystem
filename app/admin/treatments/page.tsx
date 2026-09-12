"use client";

import { useEffect, useState, useCallback } from "react";
import { FiPlus, FiEdit2, FiTrash2, FiEye } from "react-icons/fi";
import PageLayout from "@/components/PageLayout";
import AuthGuard from "@/components/AuthGuard";
import DataTable, { Column } from "@/components/DataTable";
import SearchBar from "@/components/SearchBar";
import Modal from "@/components/Modal";
import ConfirmDialog from "@/components/ConfirmDialog";
import ErrorMessage from "@/components/ErrorMessage";
import { useToast } from "@/components/Toast";
import { treatmentsAPI, patientsAPI, dentistsAPI } from "@/lib/api";
import { formatDate, formatCurrency, extractError } from "@/lib/utils";

interface Treatment {
  id: number;
  patient: number;
  patient_name: string;
  dentist: number;
  dentist_name: string;
  appointment?: number;
  date: string;
  diagnosis: string;
  treatment_description: string;
  notes: string;
  cost: string | number;
}

interface SelectOption { id: number; label: string; }

const EMPTY = { patient: 0, dentist: 0, date: "", diagnosis: "", treatment_description: "", notes: "", cost: "" };

export default function AdminTreatmentsPage() {
  const { showToast } = useToast();
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [modalMode, setModalMode] = useState<"add" | "edit" | "view" | null>(null);
  const [selected, setSelected] = useState<Treatment | null>(null);
  const [form, setForm] = useState<typeof EMPTY>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Treatment | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [patients, setPatients] = useState<SelectOption[]>([]);
  const [dentists, setDentists] = useState<SelectOption[]>([]);

  useEffect(() => {
    Promise.all([patientsAPI.getAll({ page_size: 200 }), dentistsAPI.getAll({ page_size: 100 })]).then(([pRes, dRes]) => {
      setPatients((pRes.data.results ?? pRes.data).map((p: { id: number; full_name: string }) => ({ id: p.id, label: p.full_name })));
      setDentists((dRes.data.results ?? dRes.data).map((d: { id: number; full_name: string }) => ({ id: d.id, label: d.full_name })));
    }).catch(() => {});
  }, []);

  const fetch = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const params: Record<string, unknown> = { page };
      if (search) params.search = search;
      const { data } = await treatmentsAPI.getAll(params);
      setTreatments(data.results ?? data);
      setTotalPages(data.total_pages ?? 1);
      setTotalCount(data.count ?? (data.results ?? data).length);
    } catch (err) { setError(extractError(err)); }
    finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { fetch(); }, [fetch]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (modalMode === "add") { await treatmentsAPI.create(form); showToast("Treatment added.", "success"); }
      else if (modalMode === "edit" && selected) { await treatmentsAPI.update(selected.id, form); showToast("Treatment updated.", "success"); }
      setModalMode(null); fetch();
    } catch (err) { showToast(extractError(err), "error"); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await treatmentsAPI.delete(deleteTarget.id);
      showToast("Treatment deleted.", "success");
      setDeleteTarget(null); fetch();
    } catch (err) { showToast(extractError(err), "error"); }
    finally { setDeleting(false); }
  };

  const columns: Column<Treatment>[] = [
    { key: "id", header: "ID", render: (r) => <span className="text-xs text-gray-400">#{r.id}</span> },
    { key: "date", header: "Date", render: (r) => formatDate(r.date) },
    { key: "patient_name", header: "Patient", render: (r) => <span className="font-medium">{r.patient_name}</span> },
    { key: "dentist_name", header: "Dentist", render: (r) => `Dr. ${r.dentist_name}` },
    { key: "diagnosis", header: "Diagnosis", render: (r) => <span className="line-clamp-1 max-w-[180px]">{r.diagnosis || "—"}</span> },
    { key: "cost", header: "Cost", render: (r) => <span className="font-semibold text-green-700">{formatCurrency(Number(r.cost))}</span> },
    {
      key: "actions", header: "Actions",
      render: (r) => (
        <div className="flex gap-1">
          <button onClick={() => { setSelected(r); setModalMode("view"); }} className="btn-secondary btn-sm p-1.5"><FiEye className="w-3.5 h-3.5" /></button>
          <button onClick={() => { setForm({ patient: r.patient, dentist: r.dentist, date: r.date, diagnosis: r.diagnosis, treatment_description: r.treatment_description, notes: r.notes, cost: String(r.cost) }); setSelected(r); setModalMode("edit"); }} className="btn-secondary btn-sm p-1.5"><FiEdit2 className="w-3.5 h-3.5" /></button>
          <button onClick={() => setDeleteTarget(r)} className="btn-danger btn-sm p-1.5"><FiTrash2 className="w-3.5 h-3.5" /></button>
        </div>
      ),
    },
  ];

  const TreatmentForm = () => (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="form-group">
          <label className="label">Patient</label>
          <select value={form.patient} onChange={(e) => setForm((p) => ({ ...p, patient: Number(e.target.value) }))} className="input">
            <option value={0}>Select patient</option>
            {patients.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="label">Dentist</label>
          <select value={form.dentist} onChange={(e) => setForm((p) => ({ ...p, dentist: Number(e.target.value) }))} className="input">
            <option value={0}>Select dentist</option>
            {dentists.map((d) => <option key={d.id} value={d.id}>Dr. {d.label}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="label">Date</label>
          <input type="date" value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} className="input" />
        </div>
        <div className="form-group">
          <label className="label">Cost (₱)</label>
          <input type="number" min="0" step="0.01" value={form.cost} onChange={(e) => setForm((p) => ({ ...p, cost: e.target.value }))} className="input" placeholder="0.00" />
        </div>
      </div>
      {(["diagnosis","treatment_description","notes"] as const).map((k)=>{
        const labelMap: Record<string,string> = { diagnosis:"Diagnosis", treatment_description:"Treatment Description", notes:"Additional Notes" };
        return (
          <div key={k} className="form-group">
            <label className="label">{labelMap[k]}</label>
            <textarea rows={3} value={form[k]??""} onChange={(e) => setForm((p) => ({ ...p, [k]: e.target.value }))} className="input resize-none" />
          </div>
        );
      })}
    </div>
  );

  return (
    <AuthGuard requiredRole="admin">
      <PageLayout role="admin" title="Treatments">
        <div className="page-header">
          <div><h2 className="page-title">Treatments</h2><p className="page-subtitle">Manage dental treatment records.</p></div>
          <button onClick={() => { setForm(EMPTY); setSelected(null); setModalMode("add"); }} className="btn-primary">
            <FiPlus className="w-4 h-4" /> Add Treatment
          </button>
        </div>

        <div className="card mb-5">
          <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search by patient or diagnosis…" />
        </div>

        {error ? <ErrorMessage message={error} onRetry={fetch} /> : (
          <div className="card">
            <DataTable columns={columns} data={treatments} loading={loading} keyExtractor={(r) => r.id}
              page={page} totalPages={totalPages} totalCount={totalCount} onPageChange={setPage} emptyMessage="No treatments found." />
          </div>
        )}

        <Modal isOpen={modalMode === "add" || modalMode === "edit"} onClose={() => setModalMode(null)}
          title={modalMode === "add" ? "Add Treatment" : "Edit Treatment"} size="lg"
          footer={<><button onClick={() => setModalMode(null)} className="btn-secondary">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Save"}
            </button></>}>
          <TreatmentForm />
        </Modal>

        <Modal isOpen={modalMode === "view"} onClose={() => setModalMode(null)} title={`Treatment #${selected?.id}`} size="lg">
          {selected && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                {[["Patient",selected.patient_name],["Dentist",`Dr. ${selected.dentist_name}`],["Date",formatDate(selected.date)],["Cost",formatCurrency(Number(selected.cost))]].map(([l,v])=>(
                  <div key={l}><p className="text-xs text-gray-400 mb-0.5">{l}</p><p className="text-sm font-medium">{v}</p></div>
                ))}
              </div>
              {[["Diagnosis",selected.diagnosis],["Treatment",selected.treatment_description],["Notes",selected.notes]].map(([l,v])=> v ? (
                <div key={l}><p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{l}</p>
                  <p className="text-sm text-gray-800 bg-gray-50 rounded-xl p-3">{v}</p></div>
              ) : null)}
            </div>
          )}
        </Modal>

        <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
          title="Delete Treatment" message={`Delete treatment #${deleteTarget?.id}? This cannot be undone.`} loading={deleting} />
      </PageLayout>
    </AuthGuard>
  );
}
