"use client";

import { useEffect, useState, useCallback } from "react";
import { FiMail, FiCheck } from "react-icons/fi";
import PageLayout from "@/components/PageLayout";
import AuthGuard from "@/components/AuthGuard";
import SearchBar from "@/components/SearchBar";
import MessagePanel from "@/components/MessagePanel";
import Loading from "@/components/Loading";
import ErrorMessage from "@/components/ErrorMessage";
import { useToast } from "@/components/Toast";
import { messagesAPI } from "@/lib/api";
import { formatDateTime, getStatusColor, truncate, extractError } from "@/lib/utils";

interface Thread {
  id: number;
  subject: string;
  patient_name: string;
  last_message: string;
  last_message_at: string;
  is_read: boolean;
  unread_count: number;
}

interface Message {
  id: number;
  sender_name: string;
  sender_role: "admin" | "patient";
  content: string;
  created_at: string;
  is_read: boolean;
}

export default function AdminMessagesPage() {
  const { showToast } = useToast();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [activeThread, setActiveThread] = useState<Thread | null>(null);
  const [threadMessages, setThreadMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [markingRead, setMarkingRead] = useState(false);

  const fetchThreads = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const params: Record<string, unknown> = {};
      if (search) params.search = search;
      const { data } = await messagesAPI.getAll(params);
      setThreads(data.results ?? data);
    } catch (err) { setError(extractError(err)); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { fetchThreads(); }, [fetchThreads]);

  const openThread = async (thread: Thread) => {
    setActiveThread(thread);
    setLoadingMessages(true);
    try {
      const { data } = await messagesAPI.getOne(thread.id);
      setThreadMessages(data.messages ?? []);
      if (!thread.is_read) {
        await messagesAPI.markRead(thread.id);
        fetchThreads();
      }
    } catch { showToast("Failed to load thread.", "error"); }
    finally { setLoadingMessages(false); }
  };

  const handleMarkRead = async (id: number) => {
    setMarkingRead(true);
    try {
      await messagesAPI.markRead(id);
      fetchThreads();
      if (activeThread?.id === id) setActiveThread((t) => t ? { ...t, is_read: true } : t);
      showToast("Marked as read.", "success");
    } catch { showToast("Failed.", "error"); }
    finally { setMarkingRead(false); }
  };

  const unreadCount = threads.filter((t) => !t.is_read).length;

  return (
    <AuthGuard requiredRole="admin">
      <PageLayout role="admin" title="Messages">
        <div className="page-header">
          <div>
            <h2 className="page-title">Patient Messages</h2>
            <p className="page-subtitle">
              {unreadCount > 0
                ? `${unreadCount} unread message${unreadCount > 1 ? "s" : ""}`
                : "All messages read"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 h-[calc(100vh-220px)]">
          {/* Thread list */}
          <div className="card flex flex-col gap-3 overflow-hidden">
            <SearchBar value={search} onChange={(v) => setSearch(v)} placeholder="Search messages…" />
            <div className="flex-1 overflow-y-auto flex flex-col gap-2">
              {loading ? <Loading size="sm" /> : error ? <ErrorMessage message={error} onRetry={fetchThreads} /> :
                threads.length === 0 ? (
                  <div className="text-center py-8"><FiMail className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">No messages.</p></div>
                ) : threads.map((t) => (
                  <button key={t.id} onClick={() => openThread(t)}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      activeThread?.id === t.id ? "border-blue-500 bg-blue-50" : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                    }`}>
                    <div className="flex items-start justify-between gap-2 mb-0.5">
                      <p className={`text-sm truncate ${!t.is_read ? "font-semibold text-gray-900" : "text-gray-700"}`}>{t.subject}</p>
                      {t.unread_count > 0 && (
                        <span className="flex-shrink-0 w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
                          {t.unread_count}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-blue-600 font-medium">{t.patient_name}</p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{truncate(t.last_message, 45)}</p>
                    <p className="text-xs text-gray-300 mt-1">{formatDateTime(t.last_message_at)}</p>
                  </button>
                ))
              }
            </div>
          </div>

          {/* Message panel */}
          <div className="lg:col-span-2 card flex flex-col overflow-hidden">
            {activeThread ? (
              <>
                <div className="border-b border-gray-100 pb-3 mb-4 flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{activeThread.subject}</h3>
                    <p className="text-sm text-blue-600">{activeThread.patient_name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`badge ${getStatusColor(activeThread.is_read ? "read" : "unread")}`}>
                      {activeThread.is_read ? "Read" : "Unread"}
                    </span>
                    {!activeThread.is_read && (
                      <button onClick={() => handleMarkRead(activeThread.id)} disabled={markingRead}
                        className="btn-secondary btn-sm">
                        <FiCheck className="w-3.5 h-3.5" /> Mark Read
                      </button>
                    )}
                  </div>
                </div>
                {loadingMessages ? <Loading size="sm" /> : (
                  <MessagePanel messages={threadMessages} threadId={activeThread.id}
                    onMessageSent={() => openThread(activeThread)} currentRole="admin" />
                )}
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center gap-3">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center">
                  <FiMail className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 text-sm">Select a message thread to view the conversation.</p>
              </div>
            )}
          </div>
        </div>
      </PageLayout>
    </AuthGuard>
  );
}
