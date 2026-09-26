"use client";

import { useEffect, useState, useCallback } from "react";
import PageLayout from "@/components/PageLayout";
import DataTable from "@/components/DataTable";
import Modal from "@/components/Modal";
import ConfirmDialog from "@/components/ConfirmDialog";
import SearchBar from "@/components/SearchBar";
import { FilterSelect } from "@/components/Filter";
import { dentistsAPI } from "@/lib/api";
import { getStatusColor, extractError } from "@/lib/utils";
import { useToast } from "@/components/Toast";

interface Dentist {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  specialization: string;
  license_number: string;
  schedule: Record<string, string>;
  status: string;
}

const blank = (): Partial<Dentist> => ({
  full_name: "", email: "", phone: "", specialization: "",
  license_number: "", schedule: {}, status: "ACTIVE",
});

const SPECIALIZATIONS = [
  "General Dentistry", "Orthodontics", "Oral Surgery",
  "Cosmetic Dentistry", "Periodontics", "Endodontics", "Pediatric Dentistry",
];

export default function AdminDentistsPage() {
  const { showToast } = useToast();
  const [dentists, setDentists] = useState<Dentist[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"add" | "edit" | "view" | null>(null);
  const [selected, setSelected] = useState<Dentist | null>(null);
  const [form, setForm] = useState<Partial<Dentist>>(blank());
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await dentistsAPI.getAll({ page, search: search || undefined, status: statusFilter || undefined });
      setDentists(data.results ?? []);
      setCount(data.count ?? 0);
    } catch (err) { showToast(extractError(err), "error"); }
    finally { setLoading(false); }
  }, [page, search, statusFilter, showToast]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (mode === "add") { await dentistsAPI.create(form); showToast("Dentist added.", "success"); }
      else if (mode === "edit" && selected) { await dentistsAPI.patch(selected.id, form); showToast("Dentist updated.", "success"); }
      setMode(null); load();
    } catch (err) { showToast(extractError(err), "error"); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await dentistsAPI.delete(deleteId);
      showToast("Dentist deleted.", "success");
      setDeleteId(null); load();
    } catch (err) { showToast(extractError(err), "error"); }
    finally { setDeleting(false); }
  };

  const f = (k: keyof Dentist) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  const columns = [
    { key: "full_name", header: "Name", render: (r: Dentist) => `Dr. ${r.full_name}` },
    { key: "email", header: "Email", render: (r: Dentist) => r.email },
    { key: "specialization", header: "Specialization", render: (r: Dentist) => r.specialization || "—" },
    { key: "license_number", header: "License", render: (r: Dentist) => r.license_number },
    { key: "status", header: "Status", render: (r: Dentist) => (
        <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getStatusColor(r.status)}`}>{r.status}</span>
    )},
    { key: "actions", header: "Actions", render: (r: Dentist) => (
        <div className="flex gap-1">
          <button onClick={() => { setSelected(r); setMode("view"); }} className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100">View</button>
          <button onClick={() => { setSelected(r); setForm({ ...r }); setMode("edit"); }} className="px-2 py-1 text-xs bg-yellow-50 text-yellow-700 rounded hover:bg-yellow-100">Edit</button>
          <button onClick={() => setDeleteId(r.id)} className="px-2 py-1 text-xs bg-red-50 text-red-700 rounded hover:bg-red-100">Delete</button>
        </div>
    )},
  ];

  return (
    <PageLayout title="Dentists">
      <div className="p-6">
        <div className="flex flex-wrap gap-3 mb-4 justify-between">
          <div className="flex gap-3">
            <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search name, email…" />
            <FilterSelect label="Status" value={statusFilter} onChange={(v) => { setStatusFilter(v); setPage(1); }}
              options={[{ value: "", label: "All" }, { value: "ACTIVE", label: "Active" }, { value: "INACTIVE", label: "Inactive" }]} />
          </div>
          <button onClick={() => { setForm(blank()); setMode("add"); }} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">+ Add Dentist</button>
        </div>
        <DataTable columns={columns} data={dentists} loading={loading}
          pagination={{ page, totalCount: count, pageSize: 20, onPageChange: setPage }} />
      </div>

      <Modal open={!!mode} onClose={() => setMode(null)}
        title={mode === "add" ? "Add Dentist" : mode === "edit" ? "Edit Dentist" : "Dentist Details"} size="md">
        {mode === "view" && selected ? (
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[["Full Name", `Dr. ${selected.full_name}`], ["Email", selected.email], ["Phone", selected.phone],
              ["Specialization", selected.specialization], ["License No.", selected.license_number], ["Status", selected.status]
            ].map(([l, v]) => <div key={l}><p className="text-gray-500 font-medium">{l}</p><p>{v || "—"}</p></div>)}
          </div>
        ) : (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              {[{ k: "full_name" as const, l: "Full Name", t: "text" }, { k: "email" as const, l: "Email", t: "email" },
                { k: "phone" as const, l: "Phone", t: "tel" }, { k: "license_number" as const, l: "License Number", t: "text" }
              ].map(({ k, l, t }) => (
                <div key={k}>
                  <label className="block font-medium text-gray-700 mb-1">{l}</label>
                  <input type={t} value={form[k] as string ?? ""} onChange={f(k)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              ))}
              <div>
                <label className="block font-medium text-gray-700 mb-1">Specialization</label>
                <select value={form.specialization ?? ""} onChange={f("specialization")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select…</option>
                  {SPECIALIZATIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1">Status</label>
                <select value={form.status ?? "ACTIVE"} onChange={f("status")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {["ACTIVE", "INACTIVE", "ON_LEAVE"].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
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

      <ConfirmDialog open={!!deleteId} title="Delete Dentist" message="Remove this dentist permanently?"
        variant="danger" loading={deleting} onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
    </PageLayout>
  );
}
