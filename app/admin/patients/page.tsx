"use client";

import { useEffect, useState, useCallback } from "react";
import PageLayout from "@/components/PageLayout";
import DataTable from "@/components/DataTable";
import Modal from "@/components/Modal";
import ConfirmDialog from "@/components/ConfirmDialog";
import SearchBar from "@/components/SearchBar";
import { FilterSelect } from "@/components/Filter";
import { patientsAPI } from "@/lib/api";
import { formatDate, getStatusColor, extractError } from "@/lib/utils";
import { useToast } from "@/components/Toast";

interface Patient {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  gender: string;
  date_of_birth: string;
  address: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  medical_notes: string;
  status: string;
  created_at: string;
}

const blank = (): Partial<Patient> => ({
  full_name: "", email: "", phone: "", gender: "", date_of_birth: "",
  address: "", emergency_contact_name: "", emergency_contact_phone: "",
  medical_notes: "", status: "ACTIVE",
});

export default function AdminPatientsPage() {
  const { showToast } = useToast();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const [mode, setMode] = useState<"view" | "add" | "edit" | null>(null);
  const [selected, setSelected] = useState<Patient | null>(null);
  const [form, setForm] = useState<Partial<Patient>>(blank());
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await patientsAPI.getAll({
        page, search: search || undefined, status: statusFilter || undefined,
      });
      setPatients(data.results ?? []);
      setCount(data.count ?? 0);
    } catch (err) { showToast(extractError(err), "error"); }
    finally { setLoading(false); }
  }, [page, search, statusFilter, showToast]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (mode === "add") {
        await patientsAPI.create(form);
        showToast("Patient created.", "success");
      } else if (mode === "edit" && selected) {
        await patientsAPI.patch(selected.id, form);
        showToast("Patient updated.", "success");
      }
      setMode(null);
      load();
    } catch (err) { showToast(extractError(err), "error"); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await patientsAPI.delete(deleteId);
      showToast("Patient deleted.", "success");
      setDeleteId(null);
      load();
    } catch (err) { showToast(extractError(err), "error"); }
    finally { setDeleting(false); }
  };

  const openEdit = (p: Patient) => { setSelected(p); setForm({ ...p }); setMode("edit"); };
  const openView = (p: Patient) => { setSelected(p); setMode("view"); };

  const f = (k: keyof Patient) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }));

  const columns = [
    { key: "full_name", header: "Name", render: (r: Patient) => r.full_name },
    { key: "email", header: "Email", render: (r: Patient) => r.email },
    { key: "phone", header: "Phone", render: (r: Patient) => r.phone || "—" },
    { key: "gender", header: "Gender", render: (r: Patient) => r.gender || "—" },
    { key: "created_at", header: "Registered", render: (r: Patient) => formatDate(r.created_at) },
    {
      key: "status", header: "Status",
      render: (r: Patient) => (
        <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getStatusColor(r.status)}`}>{r.status}</span>
      ),
    },
    {
      key: "actions", header: "Actions",
      render: (r: Patient) => (
        <div className="flex gap-1">
          <button onClick={() => openView(r)} className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100">View</button>
          <button onClick={() => openEdit(r)} className="px-2 py-1 text-xs bg-yellow-50 text-yellow-700 rounded hover:bg-yellow-100">Edit</button>
          <button onClick={() => setDeleteId(r.id)} className="px-2 py-1 text-xs bg-red-50 text-red-700 rounded hover:bg-red-100">Delete</button>
        </div>
      ),
    },
  ];

  return (
    <PageLayout title="Patients">
      <div className="p-6">
        <div className="flex flex-wrap gap-3 mb-4 justify-between">
          <div className="flex gap-3">
            <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search name, email…" />
            <FilterSelect placeholder="All Statuses" value={statusFilter} onChange={(v) => { setStatusFilter(v); setPage(1); }}
              options={[{ value: "ACTIVE", label: "Active" }, { value: "INACTIVE", label: "Inactive" }]} />
          </div>
          <button onClick={() => { setForm(blank()); setMode("add"); }}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
            + Add Patient
          </button>
        </div>
        <DataTable columns={columns} data={patients} loading={loading}
          pagination={{ page, totalCount: count, pageSize: 20, onPageChange: setPage }} />
      </div>

      {/* View/Add/Edit Modal */}
      <Modal open={!!mode && mode !== null} onClose={() => setMode(null)}
        title={mode === "add" ? "Add Patient" : mode === "edit" ? "Edit Patient" : "Patient Details"} size="lg">
        {mode === "view" && selected ? (
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              ["Full Name", selected.full_name], ["Email", selected.email],
              ["Phone", selected.phone], ["Gender", selected.gender],
              ["Date of Birth", formatDate(selected.date_of_birth)], ["Status", selected.status],
              ["Address", selected.address], ["Emergency Contact", selected.emergency_contact_name],
              ["Emergency Phone", selected.emergency_contact_phone], ["Medical Notes", selected.medical_notes],
            ].map(([label, val]) => (
              <div key={label}>
                <p className="text-gray-500 font-medium">{label}</p>
                <p className="mt-0.5">{val || "—"}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              {[
                { k: "full_name" as const, label: "Full Name", type: "text" },
                { k: "email" as const, label: "Email", type: "email" },
                { k: "phone" as const, label: "Phone", type: "tel" },
                { k: "date_of_birth" as const, label: "Date of Birth", type: "date" },
              ].map(({ k, label, type }) => (
                <div key={k}>
                  <label className="block font-medium text-gray-700 mb-1">{label}</label>
                  <input type={type} value={form[k] ?? ""} onChange={f(k)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              ))}
              <div>
                <label className="block font-medium text-gray-700 mb-1">Gender</label>
                <select value={form.gender ?? ""} onChange={f("gender")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select…</option>
                  {["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"].map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1">Status</label>
                <select value={form.status ?? "ACTIVE"} onChange={f("status")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {["ACTIVE", "INACTIVE", "ARCHIVED"].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block font-medium text-gray-700 mb-1">Address</label>
              <input type="text" value={form.address ?? ""} onChange={f("address")}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-gray-700 mb-1">Emergency Contact Name</label>
                <input type="text" value={form.emergency_contact_name ?? ""} onChange={f("emergency_contact_name")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1">Emergency Contact Phone</label>
                <input type="tel" value={form.emergency_contact_phone ?? ""} onChange={f("emergency_contact_phone")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div>
              <label className="block font-medium text-gray-700 mb-1">Medical Notes</label>
              <textarea rows={3} value={form.medical_notes ?? ""} onChange={f("medical_notes")}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setMode(null)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={handleSave} disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:bg-blue-300">
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!deleteId} title="Delete Patient" message="Are you sure? This cannot be undone."
        variant="danger" loading={deleting} onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
    </PageLayout>
  );
}
