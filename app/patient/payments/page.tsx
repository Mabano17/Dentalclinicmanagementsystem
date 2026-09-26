"use client";

import { useEffect, useState, useCallback } from "react";
import PageLayout from "@/components/PageLayout";
import DataTable from "@/components/DataTable";
import Modal from "@/components/Modal";
import { FilterSelect } from "@/components/Filter";
import { paymentsAPI } from "@/lib/api";
import { formatDate, formatCurrency, getStatusColor, extractError } from "@/lib/utils";
import { useToast } from "@/components/Toast";

interface Payment {
  id: string;
  appointment: string | null;
  amount: string;
  payment_date: string | null;
  payment_method: string;
  payment_status: string;
  reference_number: string | null;
  notes: string;
  created_at: string;
}

const METHOD_LABEL: Record<string, string> = {
  CASH: "Cash", GCASH: "GCash", BANK_TRANSFER: "Bank Transfer", OTHER: "Other",
};

export default function PatientPaymentsPage() {
  const { showToast } = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Payment | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await paymentsAPI.getAll({ page, payment_status: statusFilter || undefined });
      setPayments(data.results ?? []);
      setCount(data.count ?? 0);
    } catch (err) { showToast(extractError(err), "error"); }
    finally { setLoading(false); }
  }, [page, statusFilter, showToast]);

  useEffect(() => { load(); }, [load]);

  const columns = [
    { key: "amount", header: "Amount", render: (r: Payment) => <span className="font-semibold text-gray-800">{formatCurrency(r.amount)}</span> },
    { key: "method", header: "Method", render: (r: Payment) => METHOD_LABEL[r.payment_method] ?? r.payment_method },
    { key: "date", header: "Date", render: (r: Payment) => formatDate(r.payment_date ?? "") },
    {
      key: "status", header: "Status",
      render: (r: Payment) => (
        <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getStatusColor(r.payment_status)}`}>{r.payment_status}</span>
      ),
    },
    { key: "reference", header: "Reference", render: (r: Payment) => r.reference_number ?? "—" },
    {
      key: "actions", header: "",
      render: (r: Payment) => (
        <button onClick={() => setSelected(r)} className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100">View</button>
      ),
    },
  ];

  return (
    <PageLayout title="My Payments">
      <div className="p-6">
        <div className="flex gap-3 mb-4">
          <FilterSelect label="Status" value={statusFilter} onChange={(v) => { setStatusFilter(v); setPage(1); }}
            options={[
              { value: "", label: "All" },
              { value: "PENDING", label: "Pending" },
              { value: "PAID", label: "Paid" },
              { value: "CANCELLED", label: "Cancelled" },
            ]} />
        </div>
        <DataTable columns={columns} data={payments} loading={loading}
          pagination={{ page, totalCount: count, pageSize: 20, onPageChange: setPage }} />
      </div>

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Payment Details" size="sm">
        {selected && (
          <div className="space-y-3 text-sm">
            {[
              ["Amount", formatCurrency(selected.amount)],
              ["Method", METHOD_LABEL[selected.payment_method] ?? selected.payment_method],
              ["Status", selected.payment_status],
              ["Payment Date", formatDate(selected.payment_date ?? "")],
              ["Reference #", selected.reference_number ?? "—"],
              ["Notes", selected.notes || "—"],
            ].map(([l, v]) => (
              <div key={l} className="flex gap-2">
                <span className="font-medium text-gray-500 w-28 flex-shrink-0">{l}:</span>
                <span className="text-gray-800">{v}</span>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </PageLayout>
  );
}
