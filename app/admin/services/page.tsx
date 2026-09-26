"use client";

import { useEffect, useState, useCallback } from "react";
import PageLayout from "@/components/PageLayout";
import DataTable from "@/components/DataTable";
import Modal from "@/components/Modal";
import ConfirmDialog from "@/components/ConfirmDialog";
import SearchBar from "@/components/SearchBar";
import { servicesAPI } from "@/lib/api";
import { formatCurrency, getStatusColor, extractError } from "@/lib/utils";
import { useToast } from "@/components/Toast";

interface Service {
  id: string;
  name: string;
  description: string;
  price: string;
  duration_minutes: number;
  status: string;
}

const blank = (): Partial<Service> => ({
  name: "", description: "", price: "", duration_minutes: 30, status: "ACTIVE",
});

const PRESET_SERVICES = [
  "Dental Check-up", "Dental Cleaning", "Tooth Extraction",
  "Dental Filling", "Root Canal Treatment", "Teeth Whitening", "Braces Consultation",
];

export default function AdminServicesPage() {
  const { showToast } = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"add" | "edit" | null>(null);
  const [selected, setSelected] = useState<Service | null>(null);
  const [form, setForm] = useState<Partial<Service>>(blank());
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await servicesAPI.getAll({ page, search: search || undefined });
      setServices(data.results ?? []);
      setCount(data.count ?? 0);
    } catch (err) { showToast(extractError(err), "error"); }
    finally { setLoading(false); }
  }, [page, search, showToast]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (mode === "add") { await servicesAPI.create(form); showToast("Service created.", "success"); }
      else if (mode === "edit" && selected) { await servicesAPI.patch(selected.id, form); showToast("Service updated.", "success"); }
      setMode(null); load();
    } catch (err) { showToast(extractError(err), "error"); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await servicesAPI.delete(deleteId);
      showToast("Service deleted.", "success");
      setDeleteId(null); load();
    } catch (err) { showToast(extractError(err), "error"); }
    finally { setDeleting(false); }
  };

  const f = (k: keyof Service) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  const columns = [
    { key: "name", header: "Service Name", render: (r: Service) => r.name },
    { key: "price", header: "Price", render: (r: Service) => formatCurrency(r.price) },
    { key: "duration_minutes", header: "Duration", render: (r: Service) => `${r.duration_minutes} min` },
    { key: "status", header: "Status", render: (r: Service) => (
        <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getStatusColor(r.status)}`}>{r.status}</span>
    )},
    { key: "actions", header: "Actions", render: (r: Service) => (
        <div className="flex gap-1">
          <button onClick={() => { setSelected(r); setForm({ ...r }); setMode("edit"); }} className="px-2 py-1 text-xs bg-yellow-50 text-yellow-700 rounded hover:bg-yellow-100">Edit</button>
          <button onClick={() => setDeleteId(r.id)} className="px-2 py-1 text-xs bg-red-50 text-red-700 rounded hover:bg-red-100">Delete</button>
        </div>
    )},
  ];

  return (
    <PageLayout title="Services">
      <div className="p-6">
        <div className="flex gap-3 mb-4 justify-between">
          <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search services…" />
          <button onClick={() => { setForm(blank()); setMode("add"); }} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">+ Add Service</button>
        </div>
        <DataTable columns={columns} data={services} loading={loading}
          pagination={{ page, totalCount: count, pageSize: 20, onPageChange: setPage }} />
      </div>

      <Modal open={!!mode} onClose={() => setMode(null)}
        title={mode === "add" ? "Add Service" : "Edit Service"} size="md">
        <div className="space-y-3 text-sm">
          <div>
            <label className="block font-medium text-gray-700 mb-1">Service Name</label>
            {mode === "add" ? (
              <select value={form.name ?? ""} onChange={(e) => { f("name")(e); }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select or type…</option>
                {PRESET_SERVICES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            ) : (
              <input type="text" value={form.name ?? ""} onChange={f("name")}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            )}
          </div>
          <div>
            <label className="block font-medium text-gray-700 mb-1">Description</label>
            <textarea rows={3} value={form.description ?? ""} onChange={f("description")}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-gray-700 mb-1">Price (₱)</label>
              <input type="number" min="0" step="0.01" value={form.price ?? ""} onChange={f("price")}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block font-medium text-gray-700 mb-1">Duration (minutes)</label>
              <input type="number" min="1" value={form.duration_minutes ?? 30} onChange={f("duration_minutes")}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label className="block font-medium text-gray-700 mb-1">Status</label>
            <select value={form.status ?? "ACTIVE"} onChange={f("status")}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setMode(null)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:bg-blue-300">
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteId} title="Delete Service" message="Delete this service permanently?"
        variant="danger" loading={deleting} onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
    </PageLayout>
  );
}
