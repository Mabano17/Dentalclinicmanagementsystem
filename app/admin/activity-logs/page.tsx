"use client";

import { useEffect, useState, useCallback } from "react";
import { FiList, FiUser, FiClock, FiMonitor } from "react-icons/fi";
import PageLayout from "@/components/PageLayout";
import AuthGuard from "@/components/AuthGuard";
import DataTable, { Column } from "@/components/DataTable";
import SearchBar from "@/components/SearchBar";
import { FilterSelect } from "@/components/Filter";
import ErrorMessage from "@/components/ErrorMessage";
import { activityLogsAPI } from "@/lib/api";
import { formatDateTime, extractError } from "@/lib/utils";

interface ActivityLog {
  id: number;
  user: string;
  action: string;
  description: string;
  ip_address?: string;
  created_at: string;
}

const ACTION_OPTS = [
  { label: "All Actions", value: "" },
  { label: "Login", value: "login" },
  { label: "Logout", value: "logout" },
  { label: "Create", value: "create" },
  { label: "Update", value: "update" },
  { label: "Delete", value: "delete" },
  { label: "View", value: "view" },
];

const ACTION_COLORS: Record<string, string> = {
  login: "bg-green-100 text-green-700 border-green-200",
  logout: "bg-gray-100 text-gray-600 border-gray-200",
  create: "bg-blue-100 text-blue-700 border-blue-200",
  update: "bg-yellow-100 text-yellow-700 border-yellow-200",
  delete: "bg-red-100 text-red-700 border-red-200",
  view: "bg-purple-100 text-purple-700 border-purple-200",
};

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetch = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const params: Record<string, unknown> = { page };
      if (search) params.search = search;
      if (actionFilter) params.action = actionFilter;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      const { data } = await activityLogsAPI.getAll(params);
      setLogs(data.results ?? data);
      setTotalPages(data.total_pages ?? 1);
      setTotalCount(data.count ?? (data.results ?? data).length);
    } catch (err) { setError(extractError(err)); }
    finally { setLoading(false); }
  }, [page, search, actionFilter, dateFrom, dateTo]);

  useEffect(() => { fetch(); }, [fetch]);

  const columns: Column<ActivityLog>[] = [
    { key: "id", header: "#", render: (r) => <span className="text-xs text-gray-400">{r.id}</span> },
    {
      key: "user", header: "User",
      render: (r) => (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <FiUser className="w-3 h-3 text-blue-600" />
          </div>
          <span className="text-sm font-medium">{r.user}</span>
        </div>
      ),
    },
    {
      key: "action", header: "Action",
      render: (r) => (
        <span className={`badge border ${ACTION_COLORS[r.action?.toLowerCase()] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>
          {r.action}
        </span>
      ),
    },
    {
      key: "description", header: "Description",
      render: (r) => <span className="text-sm text-gray-600 line-clamp-2 max-w-xs">{r.description || "—"}</span>,
    },
    {
      key: "ip_address", header: "IP Address",
      render: (r) => (
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <FiMonitor className="w-3 h-3" />
          {r.ip_address || "—"}
        </div>
      ),
    },
    {
      key: "created_at", header: "Date & Time",
      render: (r) => (
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <FiClock className="w-3 h-3" />
          {formatDateTime(r.created_at)}
        </div>
      ),
    },
  ];

  return (
    <AuthGuard requiredRole="admin">
      <PageLayout role="admin" title="Activity Logs">
        <div className="page-header">
          <div>
            <h2 className="page-title">Activity Logs</h2>
            <p className="page-subtitle">Track all system actions and user activity.</p>
          </div>
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2">
            <FiList className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">{totalCount} records</span>
          </div>
        </div>

        <div className="card mb-5">
          <div className="flex flex-wrap gap-3">
            <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search by user or description…" className="flex-1 min-w-48" />
            <FilterSelect value={actionFilter} options={ACTION_OPTS} onChange={(v) => { setActionFilter(v); setPage(1); }} className="w-40" />
            <div className="flex items-center gap-2">
              <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                className="input h-10 w-38" title="From date" />
              <span className="text-gray-400 text-sm">to</span>
              <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                className="input h-10 w-38" title="To date" />
            </div>
            {(search || actionFilter || dateFrom || dateTo) && (
              <button onClick={() => { setSearch(""); setActionFilter(""); setDateFrom(""); setDateTo(""); setPage(1); }}
                className="btn-secondary btn-sm h-10">
                Clear
              </button>
            )}
          </div>
        </div>

        {error ? <ErrorMessage message={error} onRetry={fetch} /> : (
          <div className="card">
            <DataTable
              columns={columns} data={logs} loading={loading} keyExtractor={(r) => r.id}
              page={page} totalPages={totalPages} totalCount={totalCount} onPageChange={setPage}
              emptyMessage="No activity logs found." />
          </div>
        )}
      </PageLayout>
    </AuthGuard>
  );
}
