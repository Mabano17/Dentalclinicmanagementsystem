"use client";

import { useEffect, useState, useCallback } from "react";
import { FiPlus, FiEdit2, FiTrash2 } from "react-icons/fi";
import { MdOutlineMedicalServices } from "react-icons/md";
import PageLayout from "@/components/PageLayout";
import AuthGuard from "@/components/AuthGuard";
import DataTable, { Column } from "@/components/DataTable";
import SearchBar from "@/components/SearchBar";
import { FilterSelect } from "@/components/Filter";
import Modal from "@/components/Modal";
import ConfirmDialog from "@/components/ConfirmDialog";
import ErrorMessage from "@/components/ErrorMessage";
import { useToast } from "@/components/Toast";
import { servicesAPI } from "@/lib/api";
import { formatCurrency, getStatusColor, extractError } from "@/lib/utils";

interface Service {
  id: number;
  name: string;
  description: string;
  price: string;
  duration_minutes: number;
  status: string;
}

const PRESET_SERVICES = [
  "Dental Check-up", "Dental Cleaning", "Tooth Extraction",
  "Dental Filling", "Root Canal Treatment", "Teeth Whitening", "Braces Consultation",
];

const EMPTY: Omit<Service, "id"> = {
  name: "", description: "", price: "", duration_minutes: 30, status: "active",
};

const STATUS_OPTS = [{ label: "All", value: "" }, { label: "Active", value: "active" }, { label: "Inactive", value: "inactive" }];

export default function AdminServicesPage() {
  const { showToast } = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [modalMode, setModalMode] = useState<"add" | "edit" | null>(null);
  const [selected, setSelected] = useState<Service | null>(null);
  const [form, setForm] = useState<Omit<Service, "id">>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const params: Record<string, unknown> = { page };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const { data } = await servicesAPI.getAll(params);
      setServices(data.results ?? data);
      setTotalPages(data.total_pages ?? 1);
      setTotalCount(data.count ?? (data.results ?? data).length);
    } catch (err) { setError(extractError(err)); }
    finally { setLoading(false); }
  }, [page, search, statusFilter]);

  useEffect(() => { fetch(); }, [fetch]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (modalMode === "add") { await servicesAPI.create(form); showToast("Service added.", "success"); }
      else if (modalMode === "edit" && selected) { await servicesAPI.update(selected.id, form); showToast("Service updated.", "success"); }
      setModalMode(null); fetch();
    } catch (err) { showToast(extractError(err), "error"); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await servicesAPI.delete(deleteTarget.id);
      showToast("Service deleted.", "success");
      setDeleteTarget(null); fetch();
    } catch (err) { showToast(extractError(err), "error"); }
    finally { setDeleting(false); }
  };

  const columns: Column<Service>[] = [
    {
      key: "name", header: "Service",
      render: (r) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center">
            <MdOutlineMedicalServices className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="font-medium text-sm">{r.name}</p>
        </div>
      ),
    },
    { key: "description", header: "Description", render: (r) => <span className="text-gray-500 text-xs line-clamp-2 max-w-xs">{r.description || "—"}</span> },
    { key: "price", header: "Price", render: (r) => <span className="font-semibold text-green-700">{formatCurrency(Number(r.price))}</span> },
    { key: "duration_minutes", header: "Duration", render: (r) => `${r.duration_minutes} min` },
    { key: "status", header: "Status", render: (r) => <span className={`badge ${getStatusColor(r.status)}`}>{r.status}</span> },
    {
      key: "actions", header: "Actions",
      render: (r) => (
        <div className="flex gap-1">
          <button onClick={() => { setForm({ ...r }); setSelected(r); setModalMode("edit"); }} className="btn-secondary btn-sm p-1.5"><FiEdit2 className="w-3.5 h-3.5" /></button>
          <button onClick={() => setDeleteTarget(r)} className="btn-danger btn-sm p-1.5"><FiTrash2 className="w-3.5 h-3.5" /></button>
        </div>
      ),
    },
  ];

  return (
    <AuthGuard requiredRole="admin">
      <PageLayout role="admin" title="Services">
        <div className="page-header">
          <div><h2 className="page-title">Dental Services</h2><p className="page-subtitle">Manage clinic service offerings and pricing.</p></div>
          <button onClick={() => { setForm(EMPTY); setSelected(null); setModalMode("add"); }} className="btn-primary">
            <FiPlus className="w-4 h-4" /> Add Service
          </button>
        </div>

        <div className="card mb-5 flex flex-col sm:flex-row gap-3">
          <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search services…" className="flex-1" />
          <FilterSelect value={statusFilter} options={STATUS_OPTS} onChange={(v) => { setStatusFilter(v); setPage(1); }} className="w-36" />
        </div>

        {error ? <ErrorMessage message={error} onRetry={fetch} /> : (
          <div className="card">
            <DataTable columns={columns} data={services} loading={loading} keyExtractor={(r) => r.id}
              page={page} totalPages={totalPages} totalCount={totalCount} onPageChange={setPage} emptyMessage="No services found." />
          </div>
        )}

        <Modal isOpen={!!modalMode} onClose={() => setModalMode(null)}
          title={modalMode === "add" ? "Add Service" : "Edit Service"}
          footer={<><button onClick={() => setModalMode(null)} className="btn-secondary">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Save"}
            </button></>}>
          <div className="flex flex-col gap-4">
            <div className="form-group">
              <label className="label">Service Name</label>
              {modalMode === "add" ? (
                <select value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className="input">
                  <option value="">Select or type a service name</option>
                  {PRESET_SERVICES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              ) : (
                <input type="text" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className="input" />
              )}
            </div>
            <div className="form-group">
              <label className="label">Description</label>
              <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={3} className="input resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="label">Price (₱)</label>
                <input type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} className="input" placeholder="0.00" />
              </div>
              <div className="form-group">
                <label className="label">Duration (minutes)</label>
                <input type="number" min="5" step="5" value={form.duration_minutes} onChange={(e) => setForm((p) => ({ ...p, duration_minutes: Number(e.target.value) }))} className="input" />
              </div>
            </div>
            <div className="form-group">
              <label className="label">Status</label>
              <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))} className="input">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </Modal>

        <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
          title="Delete Service" message={`Delete "${deleteTarget?.name}"? This cannot be undone.`} loading={deleting} />
      </PageLayout>
    </AuthGuard>
  );
}
