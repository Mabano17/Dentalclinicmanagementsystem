"use client";

import { useEffect, useState, useCallback } from "react";
import PageLayout from "@/components/PageLayout";
import DataTable from "@/components/DataTable";
import SearchBar from "@/components/SearchBar";
import { activityLogsAPI } from "@/lib/api";
import { formatDateTime, extractError } from "@/lib/utils";
import { useToast } from "@/components/Toast";

interface Log {
  id: string;
  user_email: string;
  user_name: string;
  action: string;
  description: string;
  ip_address: string;
  created_at: string;
}

const ACTION_COLORS: Record<string, string> = {
  LOGIN: "bg-green-100 text-green-700",
  LOGOUT: "bg-gray-100 text-gray-600",
  REGISTER: "bg-blue-100 text-blue-700",
  OTP_VERIFIED: "bg-blue-100 text-blue-700",
  PASSWORD_RESET: "bg-orange-100 text-orange-700",
  FORGOT_PASSWORD: "bg-yellow-100 text-yellow-700",
  PATIENT_CREATED: "bg-purple-100 text-purple-700",
  PATIENT_UPDATED: "bg-indigo-100 text-indigo-700",
  PATIENT_DELETED: "bg-red-100 text-red-700",
  APPOINTMENT_CREATED: "bg-cyan-100 text-cyan-700",
  APPOINTMENT_UPDATED: "bg-teal-100 text-teal-700",
  APPOINTMENT_DELETED: "bg-red-100 text-red-700",
  PAYMENT_CREATED: "bg-emerald-100 text-emerald-700",
  MESSAGE_SENT: "bg-sky-100 text-sky-700",
};

export default function ActivityLogsPage() {
  const { showToast } = useToast();
  const [logs, setLogs] = useState<Log[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await activityLogsAPI.getAll({
        page,
        search: search || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      });
      setLogs(data.results ?? []);
      setCount(data.count ?? 0);
    } catch (err) { showToast(extractError(err), "error"); }
    finally { setLoading(false); }
  }, [page, search, dateFrom, dateTo, showToast]);

  useEffect(() => { load(); }, [load]);

  const columns = [
    {
      key: "action", header: "Action",
      render: (r: Log) => (
        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${ACTION_COLORS[r.action] ?? "bg-gray-100 text-gray-600"}`}>
          {r.action}
        </span>
      ),
    },
    { key: "user_name", header: "User", render: (r: Log) => <span>{r.user_name ?? "—"}<br /><span className="text-xs text-gray-400">{r.user_email}</span></span> },
    { key: "description", header: "Description", render: (r: Log) => <span className="text-xs text-gray-600">{r.description}</span> },
    { key: "ip_address", header: "IP Address", render: (r: Log) => r.ip_address ?? "—" },
    { key: "created_at", header: "Date & Time", render: (r: Log) => formatDateTime(r.created_at) },
  ];

  return (
    <PageLayout title="Activity Logs">
      <div className="p-6">
        <div className="flex flex-wrap gap-3 mb-4">
          <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search action, user…" />
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">From</label>
            <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">To</label>
            <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          {(dateFrom || dateTo) && (
            <button onClick={() => { setDateFrom(""); setDateTo(""); }} className="text-sm text-blue-600 hover:underline">Clear dates</button>
          )}
        </div>
        <DataTable columns={columns} data={logs} loading={loading}
          pagination={{ page, totalCount: count, pageSize: 20, onPageChange: setPage }} />
      </div>
    </PageLayout>
  );
}
