"use client";

import { useEffect, useState, useCallback } from "react";
import { FiPlus, FiMail, FiSend } from "react-icons/fi";
import PageLayout from "@/components/PageLayout";
import AuthGuard from "@/components/AuthGuard";
import Modal from "@/components/Modal";
import MessagePanel from "@/components/MessagePanel";
import SearchBar from "@/components/SearchBar";
import Loading from "@/components/Loading";
import ErrorMessage from "@/components/ErrorMessage";
import { useToast } from "@/components/Toast";
import { messagesAPI } from "@/lib/api";
import { formatDateTime, getStatusColor, extractError, truncate } from "@/lib/utils";

interface Thread {
  id: number;
  subject: string;
  last_message: string;
  last_message_at: string;
  is_read: boolean;
  unread_count: number;
  messages?: Message[];
}

interface Message {
  id: number;
  sender_name: string;
  sender_role: "admin" | "patient";
  content: string;
  created_at: string;
  is_read: boolean;
}

export default function PatientMessagesPage() {
  const { showToast } = useToast();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [activeThread, setActiveThread] = useState<Thread | null>(null);
  const [threadMessages, setThreadMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newSubject, setNewSubject] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);

  const fetchThreads = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, unknown> = {};
      if (search) params.search = search;
      const { data } = await messagesAPI.getAll(params);
      setThreads(data.results ?? data);
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchThreads(); }, [fetchThreads]);

  const openThread = async (thread: Thread) => {
    setActiveThread(thread);
    setLoadingMessages(true);
    try {
      const { data } = await messagesAPI.getOne(thread.id);
      setThreadMessages(data.messages ?? []);
      // Mark as read
      if (!thread.is_read) {
        await messagesAPI.markRead(thread.id);
        fetchThreads();
      }
    } catch {
      showToast("Failed to load messages.", "error");
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSendNew = async () => {
    if (!newSubject.trim() || !newMessage.trim()) {
      showToast("Subject and message are required.", "warning");
      return;
    }
    setSending(true);
    try {
      await messagesAPI.send({ subject: newSubject, content: newMessage });
      showToast("Message sent successfully.", "success");
      setShowNewModal(false);
      setNewSubject("");
      setNewMessage("");
      fetchThreads();
    } catch (err) {
      showToast(extractError(err), "error");
    } finally {
      setSending(false);
    }
  };

  return (
    <AuthGuard requiredRole="patient">
      <PageLayout role="patient" title="Messages">
        <div className="page-header">
          <div>
            <h2 className="page-title">Messages</h2>
            <p className="page-subtitle">Communicate with our clinic team.</p>
          </div>
          <button
            onClick={() => setShowNewModal(true)}
            className="btn-primary"
          >
            <FiPlus className="w-4 h-4" /> New Message
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 h-[calc(100vh-220px)]">
          {/* Thread list */}
          <div className="card flex flex-col gap-3 overflow-hidden">
            <SearchBar
              value={search}
              onChange={(v) => setSearch(v)}
              placeholder="Search messages…"
            />
            <div className="flex-1 overflow-y-auto flex flex-col gap-2">
              {loading ? (
                <Loading size="sm" message="Loading…" />
              ) : error ? (
                <ErrorMessage message={error} onRetry={fetchThreads} />
              ) : threads.length === 0 ? (
                <div className="text-center py-8">
                  <FiMail className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">No messages yet.</p>
                </div>
              ) : (
                threads.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => openThread(t)}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      activeThread?.id === t.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm truncate ${!t.is_read ? "font-semibold text-gray-900" : "text-gray-700"}`}>
                        {t.subject}
                      </p>
                      {t.unread_count > 0 && (
                        <span className="flex-shrink-0 w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center font-medium">
                          {t.unread_count}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{truncate(t.last_message, 50)}</p>
                    <p className="text-xs text-gray-300 mt-1">{formatDateTime(t.last_message_at)}</p>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Message panel */}
          <div className="lg:col-span-2 card flex flex-col overflow-hidden">
            {activeThread ? (
              <>
                <div className="border-b border-gray-100 pb-3 mb-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">{activeThread.subject}</h3>
                    <span className={`badge ${getStatusColor(activeThread.is_read ? "read" : "unread")}`}>
                      {activeThread.is_read ? "Read" : "Unread"}
                    </span>
                  </div>
                </div>
                {loadingMessages ? (
                  <Loading size="sm" message="Loading messages…" />
                ) : (
                  <MessagePanel
                    messages={threadMessages}
                    threadId={activeThread.id}
                    onMessageSent={() => openThread(activeThread)}
                    currentRole="patient"
                  />
                )}
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center gap-3">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center">
                  <FiMail className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 text-sm">Select a message thread to view the conversation.</p>
                <button onClick={() => setShowNewModal(true)} className="btn-outline btn-sm">
                  <FiSend className="w-3.5 h-3.5" /> Send a Message
                </button>
              </div>
            )}
          </div>
        </div>

        {/* New message modal */}
        <Modal
          isOpen={showNewModal}
          onClose={() => setShowNewModal(false)}
          title="New Message"
          footer={
            <button onClick={handleSendNew} disabled={sending} className="btn-primary">
              {sending ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <><FiSend className="w-4 h-4" /> Send Message</>
              )}
            </button>
          }
        >
          <div className="flex flex-col gap-4">
            <div className="form-group">
              <label className="label">Subject</label>
              <input
                type="text"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                placeholder="e.g. Question about my appointment"
                className="input"
              />
            </div>
            <div className="form-group">
              <label className="label">Message</label>
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Write your message here…"
                rows={5}
                className="input resize-none"
              />
            </div>
          </div>
        </Modal>
      </PageLayout>
    </AuthGuard>
  );
}
