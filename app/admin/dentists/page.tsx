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
import { dentistsAPI } from "@/lib/api";
import { getStatusColor, extractError, getInitials } from "@/lib/utils";

interface Dentist {
  id: number;
  full_name: string;
  email: string;
  phone_number: string;
  specialization: string;
  license_number: string;
  schedule: string;
  status: string;
}

const EMPTY: Omit<Dentist, "id"> = {
  full_name: "", email: "", phone_number: "",
  specialization: "", license_number: "", schedule: "", status: "active",
};

const STATUS_OPTS = [{ label: "All", value: "" }, { label: "Active", value: "active" }, { label: "Inactive", value: "inactive" }];

const SPECIALIZATIONS = [
  "General Dentistry", "Orthodontics", "Endodontics", "Periodontics",
  "Oral Surgery", "Prosthodontics", "Pediatric Dentistry", "Cosmetic Dentistry",
];

export default function AdminDentistsPage() {
  const { showToast } = useToast();
  const [dentists, setDentists] = useState<Dentist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [modalMode, setModalMode] = useState<"add" | "edit" | "view" | null>(null);
  const [selected, setSelected] = useState<Dentist | null>(null);
  const [form, setForm] = useState<Omit<Dentist, "id">>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Dentist | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const params: Record<string, unknown> = { page };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const { data } = await dentistsAPI.getAll(params);
      setDentists(data.results ?? data);
      setTotalPages(data.total_pages ?? 1);
      setTotalCount(data.count ?? (data.results ?? data).length);
    } catch (err) { setError(extractError(err)); }
    finally { setLoading(false); }
  }, [page, search, statusFilter]);

  useEffect(() => { fetch(); }, [fetch]);

  const f = (key: keyof Omit<Dentist, "id">) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((p) => ({ ...p, [key]: e.target.value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      if (modalMode === "add") { await dentistsAPI.create(form); showToast("Dentist added.", "success"); }
      else if (modalMode === "edit" && selected) { await dentistsAPI.update(selected.id, form); showToast("Dentist updated.", "success"); }
      setModalMode(null); fetch();
    } catch (err) { showToast(extractError(err), "error"); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await dentistsAPI.delete(deleteTarget.id);
      showToast("Dentist deleted.", "success");
      setDeleteTarget(null); fetch();
    } catch (err) { showToast(extractError(err), "error"); }
    finally { setDeleting(false); }
  };

  const columns: Column<Dentist>[] = [
    {
      key: "full_name", header: "Dentist",
      render: (r) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs font-bold">
            {getInitials(r.full_name)}
          </div>
          <div>
            <p className="font-medium text-sm">Dr. {r.full_name}</p>
            <p className="text-xs text-gray-400">{r.email}</p>
          </div>
        </div>
      ),
    },
    { key: "phone_number", header: "Phone" },
    { key: "specialization", header: "Specialization" },
    { key: "license_number", header: "License No.", render: (r) => <span className="font-mono text-xs">{r.license_number}</span> },
    { key: "status", header: "Status", render: (r) => <span className={`badge ${getStatusColor(r.status)}`}>{r.status}</span> },
    {
      key: "actions", header: "Actions",
      render: (r) => (
        <div className="flex gap-1">
          <button onClick={() => { setSelected(r); setModalMode("view"); }} className="btn-secondary btn-sm p-1.5"><FiEye className="w-3.5 h-3.5" /></button>
          <button onClick={() => { setForm({ ...r }); setSelected(r); setModalMode("edit"); }} className="btn-secondary btn-sm p-1.5"><FiEdit2 className="w-3.5 h-3.5" /></button>
          <button onClick={() => setDeleteTarget(r)} className="btn-danger btn-sm p-1.5"><FiTrash2 className="w-3.5 h-3.5" /></button>
        </div>
      ),
    },
  ];

  const FormFields = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {([["full_name","Full Name","text"],["email","Email","email"],["phone_number","Phone","tel"],["license_number","License Number","text"]] as const).map(([k,l,t])=>(
        <div key={k} className="form-group">
          <label className="label">{l}</label>
          <input type={t} value={(form as Record<string,string>)[k]??""} onChange={f(k)} className="input" />
        </div>
      ))}
      <div className="form-group">
        <label className="label">Specialization</label>
        <select value={form.specialization} onChange={f("specialization")} className="input">
          <option value="">Select specialization</option>
          {SPECIALIZATIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div className="form-group">
        <label className="label">Status</label>
        <select value={form.status} onChange={f("status")} className="input">
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>
      <div className="form-group sm:col-span-2">
        <label className="label">Schedule</label>
        <textarea value={form.schedule} onChange={f("schedule")} rows={3} placeholder="e.g. Mon–Fri 8AM–5PM, Sat 8AM–12PM" className="input resize-none" />
      </div>
    </div>
  );

  return (
    <AuthGuard requiredRole="admin">
      <PageLayout role="admin" title="Dentist Management">
        <div className="page-header">
          <div><h2 className="page-title">Dentists</h2><p className="page-subtitle">Manage dentist profiles and schedules.</p></div>
          <button onClick={() => { setForm(EMPTY); setSelected(null); setModalMode("add"); }} className="btn-primary">
            <FiPlus className="w-4 h-4" /> Add Dentist
          </button>
        </div>

        <div className="card mb-5 flex flex-col sm:flex-row gap-3">
          <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search dentists…" className="flex-1" />
          <FilterSelect value={statusFilter} options={STATUS_OPTS} onChange={(v) => { setStatusFilter(v); setPage(1); }} className="w-36" />
        </div>

        {error ? <ErrorMessage message={error} onRetry={fetch} /> : (
          <div className="card">
            <DataTable columns={columns} data={dentists} loading={loading} keyExtractor={(r) => r.id}
              page={page} totalPages={totalPages} totalCount={totalCount} onPageChange={setPage} emptyMessage="No dentists found." />
          </div>
        )}

        <Modal isOpen={modalMode === "add" || modalMode === "edit"} onClose={() => setModalMode(null)}
          title={modalMode === "add" ? "Add Dentist" : "Edit Dentist"} size="lg"
          footer={<><button onClick={() => setModalMode(null)} className="btn-secondary">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Save"}
            </button></>}>
          <FormFields />
        </Modal>

        <Modal isOpen={modalMode === "view"} onClose={() => setModalMode(null)} title="Dentist Details" size="lg">
          {selected && (
            <div className="grid grid-cols-2 gap-4">
              {[["Name",`Dr. ${selected.full_name}`],["Email",selected.email],["Phone",selected.phone_number],
                ["Specialization",selected.specialization],["License No.",selected.license_number]].map(([l,v])=>(
                <div key={l}><p className="text-xs text-gray-400 mb-0.5">{l}</p><p className="text-sm font-medium">{v||"—"}</p></div>
              ))}
              <div><p className="text-xs text-gray-400 mb-0.5">Status</p><span className={`badge ${getStatusColor(selected.status)}`}>{selected.status}</span></div>
              {selected.schedule && <div className="col-span-2"><p className="text-xs text-gray-400 mb-0.5">Schedule</p><p className="text-sm">{selected.schedule}</p></div>}
            </div>
          )}
        </Modal>

        <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
          title="Delete Dentist" message={`Delete Dr. ${deleteTarget?.full_name}? This cannot be undone.`} loading={deleting} />
      </PageLayout>
    </AuthGuard>
  );
}
