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
import { patientsAPI } from "@/lib/api";
import { formatDate, genderLabel, getStatusColor, extractError, getInitials } from "@/lib/utils";

interface Patient {
  id: number;
  full_name: string;
  email: string;
  phone_number: string;
  address: string;
  date_of_birth: string;
  gender: string;
  emergency_contact: string;
  medical_notes: string;
  status: string;
}

const EMPTY_FORM: Omit<Patient, "id"> = {
  full_name: "", email: "", phone_number: "", address: "",
  date_of_birth: "", gender: "", emergency_contact: "", medical_notes: "", status: "active",
};

const STATUS_OPTS = [{ label: "All", value: "" }, { label: "Active", value: "active" }, { label: "Inactive", value: "inactive" }];

export default function AdminPatientsPage() {
  const { showToast } = useToast();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [modalMode, setModalMode] = useState<"add" | "edit" | "view" | null>(null);
  const [selected, setSelected] = useState<Patient | null>(null);
  const [form, setForm] = useState<Omit<Patient, "id">>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Patient | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, unknown> = { page };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const { data } = await patientsAPI.getAll(params);
      setPatients(data.results ?? data);
      setTotalPages(data.total_pages ?? 1);
      setTotalCount(data.count ?? (data.results ?? data).length);
    } catch (err) { setError(extractError(err)); }
    finally { setLoading(false); }
  }, [page, search, statusFilter]);

  useEffect(() => { fetchPatients(); }, [fetchPatients]);

  const openAdd = () => { setForm(EMPTY_FORM); setSelected(null); setModalMode("add"); };
  const openEdit = (p: Patient) => { setForm({ ...p }); setSelected(p); setModalMode("edit"); };
  const openView = (p: Patient) => { setSelected(p); setModalMode("view"); };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (modalMode === "add") {
        await patientsAPI.create(form);
        showToast("Patient added successfully.", "success");
      } else if (modalMode === "edit" && selected) {
        await patientsAPI.update(selected.id, form);
        showToast("Patient updated successfully.", "success");
      }
      setModalMode(null);
      fetchPatients();
    } catch (err) { showToast(extractError(err), "error"); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await patientsAPI.delete(deleteTarget.id);
      showToast("Patient deleted.", "success");
      setDeleteTarget(null);
      fetchPatients();
    } catch (err) { showToast(extractError(err), "error"); }
    finally { setDeleting(false); }
  };

  const f = (key: keyof Omit<Patient, "id">) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [key]: e.target.value }));

  const columns: Column<Patient>[] = [
    {
      key: "full_name", header: "Patient",
      render: (r) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
            {getInitials(r.full_name)}
          </div>
          <div>
            <p className="font-medium text-sm text-gray-900">{r.full_name}</p>
            <p className="text-xs text-gray-400">{r.email}</p>
          </div>
        </div>
      ),
    },
    { key: "phone_number", header: "Phone" },
    { key: "date_of_birth", header: "Date of Birth", render: (r) => formatDate(r.date_of_birth) },
    { key: "gender", header: "Gender", render: (r) => genderLabel(r.gender) },
    { key: "status", header: "Status", render: (r) => <span className={`badge ${getStatusColor(r.status)}`}>{r.status}</span> },
    {
      key: "actions", header: "Actions",
      render: (r) => (
        <div className="flex items-center gap-1">
          <button onClick={() => openView(r)} className="btn-secondary btn-sm p-1.5" title="View"><FiEye className="w-3.5 h-3.5" /></button>
          <button onClick={() => openEdit(r)} className="btn-secondary btn-sm p-1.5" title="Edit"><FiEdit2 className="w-3.5 h-3.5" /></button>
          <button onClick={() => setDeleteTarget(r)} className="btn-danger btn-sm p-1.5" title="Delete"><FiTrash2 className="w-3.5 h-3.5" /></button>
        </div>
      ),
    },
  ];

  const FormFields = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {([
        ["full_name", "Full Name", "text"], ["email", "Email", "email"],
        ["phone_number", "Phone Number", "tel"], ["date_of_birth", "Date of Birth", "date"],
        ["address", "Address", "text"], ["emergency_contact", "Emergency Contact", "text"],
      ] as const).map(([key, label, type]) => (
        <div key={key} className="form-group">
          <label className="label">{label}</label>
          <input type={type} value={(form as Record<string, string>)[key] ?? ""} onChange={f(key)} className="input" />
        </div>
      ))}
      <div className="form-group">
        <label className="label">Gender</label>
        <select value={form.gender} onChange={f("gender")} className="input">
          <option value="">Select</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
          <option value="prefer_not_to_say">Prefer not to say</option>
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
        <label className="label">Medical Notes</label>
        <textarea value={form.medical_notes} onChange={f("medical_notes")} rows={3} className="input resize-none" />
      </div>
    </div>
  );

  return (
    <AuthGuard requiredRole="admin">
      <PageLayout role="admin" title="Patient Management">
        <div className="page-header">
          <div>
            <h2 className="page-title">Patients</h2>
            <p className="page-subtitle">Manage patient records and information.</p>
          </div>
          <button onClick={openAdd} className="btn-primary"><FiPlus className="w-4 h-4" /> Add Patient</button>
        </div>

        <div className="card mb-5 flex flex-col sm:flex-row gap-3">
          <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search patients…" className="flex-1" />
          <FilterSelect value={statusFilter} options={STATUS_OPTS} onChange={(v) => { setStatusFilter(v); setPage(1); }} placeholder="All Statuses" className="w-36" />
        </div>

        {error ? <ErrorMessage message={error} onRetry={fetchPatients} /> : (
          <div className="card">
            <DataTable columns={columns} data={patients} loading={loading} keyExtractor={(r) => r.id}
              page={page} totalPages={totalPages} totalCount={totalCount} onPageChange={setPage} emptyMessage="No patients found." />
          </div>
        )}

        {/* Add / Edit Modal */}
        <Modal
          isOpen={modalMode === "add" || modalMode === "edit"}
          onClose={() => setModalMode(null)}
          title={modalMode === "add" ? "Add New Patient" : "Edit Patient"}
          size="lg"
          footer={
            <><button onClick={() => setModalMode(null)} className="btn-secondary">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Save"}
            </button></>
          }
        >
          <FormFields />
        </Modal>

        {/* View Modal */}
        <Modal isOpen={modalMode === "view"} onClose={() => setModalMode(null)} title="Patient Details" size="lg">
          {selected && (
            <div className="grid grid-cols-2 gap-4">
              {[
                ["Full Name", selected.full_name], ["Email", selected.email],
                ["Phone", selected.phone_number], ["DOB", formatDate(selected.date_of_birth)],
                ["Gender", genderLabel(selected.gender)], ["Emergency Contact", selected.emergency_contact],
                ["Address", selected.address, "full"], ["Medical Notes", selected.medical_notes, "full"],
              ].map(([label, value, span]) => (
                <div key={label} className={span === "full" ? "col-span-2" : ""}>
                  <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                  <p className="text-sm font-medium text-gray-900">{value || "—"}</p>
                </div>
              ))}
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Status</p>
                <span className={`badge ${getStatusColor(selected.status)}`}>{selected.status}</span>
              </div>
            </div>
          )}
        </Modal>

        <ConfirmDialog
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          title="Delete Patient"
          message={`Are you sure you want to delete ${deleteTarget?.full_name}? This action cannot be undone.`}
          loading={deleting}
        />
      </PageLayout>
    </AuthGuard>
  );
}
