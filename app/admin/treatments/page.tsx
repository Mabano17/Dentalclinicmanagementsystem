"use client";

import { useEffect, useState, useCallback } from "react";
import PageLayout from "@/components/PageLayout";
import DataTable from "@/components/DataTable";
import Modal from "@/components/Modal";
import ConfirmDialog from "@/components/ConfirmDialog";
import SearchBar from "@/components/SearchBar";
import { treatmentsAPI, patientsAPI, dentistsAPI } from "@/lib/api";
import { formatDate, formatCurrency, extractError } from "@/lib/utils";
import { useToast } from "@/components/Toast";

interface Treatment {
  id: string;
  patient: string;
  patient_details: { full_name: string; email: string };
  dentist: string;
  dentist_details: { full_name: string; specialization: string };
  appointment: string | null;
  description: string;
  diagnosis: string;
  treatment_date: string;
  notes: string;
  cost: string;
}

interface SelectOption { id: string; full_name: string }

const blank = (): Partial<Treatment> => ({
  patient: "", dentist: "", appointment: null,
  description: "", diagnosis: "", treatment_date: "", notes: "", cost: "0.00",
});

export default function AdminTreatmentsPage() {
  const { showToast } = useToast();
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"add" | "edit" | "view" | null>(null);
  const [selected, setSelected] = useState<Treatment | null>(null);
  const [form, setForm] = useState<Partial<Treatment>>(blank());
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [patients, setPatients] = useState<SelectOption[]>([]);
  const [dentists, setDentists] = useState<SelectOption[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await treatmentsAPI.getAll({ page, search: search || undefined });
      setTreatments(data.results ?? []);
      setCount(data.count ?? 0);
    } catch (err) { showToast(extractError(err), "error"); }
    finally { setLoading(false); }
  }, [page, search, showToast]);

  useEffect(() => { load(); }, [load]);

  const loadSelects = async () => {
    try {
      const [p, d] = await Promise.all([
        patientsAPI.getAll({ page_size: 200 }),
        dentistsAPI.getAll({ page_size: 200 }),
      ]);
      setPatients(p.data.results ?? []);
      setDentists(d.data.results ?? []);
    } catch { /* ignore */ }
  };

  const openAdd = () => { setForm(blank()); loadSelects(); setMode("add"); };
  const openEdit = (t: Treatment) => { setSelected(t); setForm({ ...t }); loadSelects(); setMode("edit"); };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (mode === "add") { await treatmentsAPI.create(form); showToast("Treatment created.", "success"); }
      else if (mode === "edit" && selected) { await treatmentsAPI.patch(selected.id, form); showToast("Treatment updated.", "success"); }
      setMode(null); load();
    } catch (err) { showToast(extractError(err), "error"); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await treatmentsAPI.delete(deleteId);
      showToast("Treatment deleted.", "success");
      setDeleteId(null); load();
    } catch (err) { showToast(extractError(err), "error"); }
    finally { setDeleting(false); }
  };

  const f = (k: keyof Treatment) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((p) => ({ ...p, [k]: e.target.value }));

  const columns = [
    { key: "patient", header: "Patient", render: (r: Treatment) => r.patient_details?.full_name ?? "—" },
    { key: "dentist", header: "Dentist", render: (r: Treatment) => `Dr. ${r.dentist_details?.full_name ?? "—"}` },
    { key: "treatment_date", header: "Date", render: (r: Treatment) => formatDate(r.treatment_date) },
    { key: "description", header: "Description", render: (r: Treatment) => r.description.slice(0, 50) + (r.description.length > 50 ? "…" : "") },
    { key: "cost", header: "Cost", render: (r: Treatment) => formatCurrency(r.cost) },
    {
      key: "actions", header: "Actions",
      render: (r: Treatment) => (
        <div className="flex gap-1">
          <button onClick={() => { setSelected(r); setMode("view"); }} className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100">View</button>
          <button onClick={() => openEdit(r)} className="px-2 py-1 text-xs bg-yellow-50 text-yellow-700 rounded hover:bg-yellow-100">Edit</button>
          <button onClick={() => setDeleteId(r.id)} className="px-2 py-1 text-xs bg-red-50 text-red-700 rounded hover:bg-red-100">Delete</button>
        </div>
      ),
    },
  ];

  return (
    <PageLayout title="Treatments">
      <div className="p-6">
        <div className="flex gap-3 mb-4 justify-between">
          <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search patient, dentist…" />
          <button onClick={openAdd} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">+ Add Treatment</button>
        </div>
        <DataTable columns={columns} data={treatments} loading={loading}
          pagination={{ page, totalCount: count, pageSize: 20, onPageChange: setPage }} />
      </div>

      <Modal open={!!mode} onClose={() => setMode(null)}
        title={mode === "view" ? "Treatment Details" : mode === "add" ? "Add Treatment" : "Edit Treatment"} size="lg">
        {mode === "view" && selected ? (
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              ["Patient", selected.patient_details?.full_name],
              ["Dentist", `Dr. ${selected.dentist_details?.full_name}`],
              ["Date", formatDate(selected.treatment_date)],
              ["Cost", formatCurrency(selected.cost)],
              ["Description", selected.description],
              ["Diagnosis", selected.diagnosis || "—"],
              ["Notes", selected.notes || "—"],
            ].map(([l, v]) => <div key={l}><p className="text-gray-500 font-medium">{l}</p><p className="mt-0.5">{v}</p></div>)}
          </div>
        ) : (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-gray-700 mb-1">Patient</label>
                <select value={form.patient ?? ""} onChange={f("patient")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select patient…</option>
                  {patients.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1">Dentist</label>
                <select value={form.dentist ?? ""} onChange={f("dentist")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select dentist…</option>
                  {dentists.map((d) => <option key={d.id} value={d.id}>Dr. {d.full_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1">Treatment Date</label>
                <input type="date" value={form.treatment_date ?? ""} onChange={f("treatment_date")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1">Cost (₱)</label>
                <input type="number" min="0" step="0.01" value={form.cost ?? "0.00"} onChange={f("cost")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            {(["description", "diagnosis", "notes"] as const).map((k) => (
              <div key={k}>
                <label className="block font-medium text-gray-700 mb-1 capitalize">{k}</label>
                <textarea rows={2} value={form[k] ?? ""} onChange={f(k)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            ))}
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setMode(null)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:bg-blue-300">
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!deleteId} title="Delete Treatment" message="Delete this treatment record permanently?"
        variant="danger" loading={deleting} onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
    </PageLayout>
  );
}
