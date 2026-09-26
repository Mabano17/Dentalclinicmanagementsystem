"use client";

import { useEffect, useState, useCallback } from "react";
import PageLayout from "@/components/PageLayout";
import DataTable from "@/components/DataTable";
import Modal from "@/components/Modal";
import { treatmentsAPI } from "@/lib/api";
import { formatDate, formatCurrency, extractError } from "@/lib/utils";
import { useToast } from "@/components/Toast";

interface Treatment {
  id: string;
  dentist_details: { full_name: string; specialization: string };
  appointment: string | null;
  description: string;
  diagnosis: string;
  treatment_date: string;
  notes: string;
  cost: string;
}

export default function PatientTreatmentsPage() {
  const { showToast } = useToast();
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Treatment | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await treatmentsAPI.getAll({ page });
      setTreatments(data.results ?? []);
      setCount(data.count ?? 0);
    } catch (err) { showToast(extractError(err), "error"); }
    finally { setLoading(false); }
  }, [page, showToast]);

  useEffect(() => { load(); }, [load]);

  const columns = [
    { key: "dentist", header: "Dentist", render: (r: Treatment) => `Dr. ${r.dentist_details?.full_name ?? "—"}` },
    { key: "treatment_date", header: "Date", render: (r: Treatment) => formatDate(r.treatment_date) },
    { key: "description", header: "Treatment", render: (r: Treatment) => r.description.slice(0, 60) + (r.description.length > 60 ? "…" : "") },
    { key: "cost", header: "Cost", render: (r: Treatment) => formatCurrency(r.cost) },
    {
      key: "actions", header: "",
      render: (r: Treatment) => (
        <button onClick={() => setSelected(r)} className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100">View</button>
      ),
    },
  ];

  return (
    <PageLayout title="Treatment History">
      <div className="p-6">
        <DataTable columns={columns} data={treatments} loading={loading}
          pagination={{ page, totalCount: count, pageSize: 20, onPageChange: setPage }} />
      </div>

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Treatment Details" size="md">
        {selected && (
          <div className="space-y-3 text-sm">
            {[
              ["Dentist", `Dr. ${selected.dentist_details?.full_name}`],
              ["Date", formatDate(selected.treatment_date)],
              ["Cost", formatCurrency(selected.cost)],
              ["Description", selected.description],
              ["Diagnosis", selected.diagnosis || "—"],
              ["Notes", selected.notes || "—"],
            ].map(([l, v]) => (
              <div key={l}>
                <p className="font-medium text-gray-500">{l}</p>
                <p className="mt-0.5 text-gray-800">{v}</p>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </PageLayout>
  );
}
