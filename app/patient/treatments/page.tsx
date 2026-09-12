"use client";

import { useEffect, useState, useCallback } from "react";
import { FiActivity, FiCalendar, FiUser, FiEye } from "react-icons/fi";
import PageLayout from "@/components/PageLayout";
import AuthGuard from "@/components/AuthGuard";
import DataTable, { Column } from "@/components/DataTable";
import SearchBar from "@/components/SearchBar";
import Modal from "@/components/Modal";
import ErrorMessage from "@/components/ErrorMessage";
import { treatmentsAPI } from "@/lib/api";
import { formatDate, formatCurrency, extractError } from "@/lib/utils";

interface Treatment {
  id: number;
  date: string;
  dentist_name: string;
  diagnosis: string;
  treatment_description: string;
  notes: string;
  cost: string | number;
}

export default function PatientTreatmentsPage() {
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selected, setSelected] = useState<Treatment | null>(null);

  const fetchTreatments = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, unknown> = { page };
      if (search) params.search = search;
      const { data } = await treatmentsAPI.getAll(params);
      setTreatments(data.results ?? data);
      setTotalPages(data.total_pages ?? 1);
      setTotalCount(data.count ?? (data.results ?? data).length);
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchTreatments(); }, [fetchTreatments]);

  const columns: Column<Treatment>[] = [
    { key: "id", header: "ID", render: (r) => <span className="text-gray-400 text-xs">#{r.id}</span> },
    { key: "date", header: "Date", render: (r) => formatDate(r.date) },
    {
      key: "dentist_name",
      header: "Dentist",
      render: (r) => (
        <div className="flex items-center gap-2">
          <FiUser className="w-3.5 h-3.5 text-gray-400" />
          Dr. {r.dentist_name}
        </div>
      ),
    },
    {
      key: "diagnosis",
      header: "Diagnosis",
      render: (r) => (
        <span className="truncate max-w-[200px] block">{r.diagnosis || "—"}</span>
      ),
    },
    {
      key: "cost",
      header: "Cost",
      render: (r) => (
        <span className="font-semibold text-green-700">{formatCurrency(Number(r.cost))}</span>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <button onClick={() => setSelected(r)} className="btn-secondary btn-sm">
          <FiEye className="w-3.5 h-3.5" /> Details
        </button>
      ),
    },
  ];

  return (
    <AuthGuard requiredRole="patient">
      <PageLayout role="patient" title="My Treatments">
        <div className="page-header">
          <div>
            <h2 className="page-title">My Treatments</h2>
            <p className="page-subtitle">View your complete dental treatment history.</p>
          </div>
        </div>

        <div className="card mb-5">
          <SearchBar
            value={search}
            onChange={(v) => { setSearch(v); setPage(1); }}
            placeholder="Search by dentist or diagnosis…"
          />
        </div>

        {error ? (
          <ErrorMessage message={error} onRetry={fetchTreatments} />
        ) : (
          <div className="card">
            <DataTable
              columns={columns}
              data={treatments}
              loading={loading}
              keyExtractor={(r) => r.id}
              page={page}
              totalPages={totalPages}
              totalCount={totalCount}
              onPageChange={setPage}
              emptyMessage="No treatment records found."
            />
          </div>
        )}

        {/* Detail modal */}
        <Modal
          isOpen={!!selected}
          onClose={() => setSelected(null)}
          title={`Treatment #${selected?.id}`}
          size="lg"
        >
          {selected && (
            <div className="flex flex-col gap-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                    <FiCalendar className="w-3 h-3" /> Date
                  </p>
                  <p className="text-sm font-medium">{formatDate(selected.date)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                    <FiUser className="w-3 h-3" /> Dentist
                  </p>
                  <p className="text-sm font-medium">Dr. {selected.dentist_name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                    <FiActivity className="w-3 h-3" /> Cost
                  </p>
                  <p className="text-sm font-semibold text-green-700">{formatCurrency(Number(selected.cost))}</p>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4 flex flex-col gap-3">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Diagnosis</p>
                  <p className="text-sm text-gray-800 bg-gray-50 rounded-xl p-3">{selected.diagnosis || "—"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Treatment</p>
                  <p className="text-sm text-gray-800 bg-gray-50 rounded-xl p-3">{selected.treatment_description || "—"}</p>
                </div>
                {selected.notes && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Notes</p>
                    <p className="text-sm text-gray-800 bg-gray-50 rounded-xl p-3">{selected.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </Modal>
      </PageLayout>
    </AuthGuard>
  );
}
