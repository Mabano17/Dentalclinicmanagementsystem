"use client";

import { useEffect, useState, useCallback } from "react";
import PageLayout from "@/components/PageLayout";
import Modal from "@/components/Modal";
import MessagePanel from "@/components/MessagePanel";
import { messagesAPI, authAPI } from "@/lib/api";
import { formatDateTime, extractError } from "@/lib/utils";
import { getUser } from "@/lib/auth";
import { useToast } from "@/components/Toast";

interface Message {
  id: string;
  sender: string;
  sender_name: string;
  receiver: string;
  receiver_name: string;
  subject: string;
  body: string;
  is_read: boolean;
  created_at: string;
}

interface AdminUser { id: string; full_name: string; email: string }

export default function PatientMessagesPage() {
  const { showToast } = useToast();
  const me = getUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [selected, setSelected] = useState<Message | null>(null);
  const [loading, setLoading] = useState(true);
  const [composeOpen, setComposeOpen] = useState(false);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [newMsg, setNewMsg] = useState({ receiver: "", subject: "", body: "" });
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await messagesAPI.getAll({ page_size: 100 });
      setMessages(data.results ?? []);
    } catch (err) { showToast(extractError(err), "error"); }
    finally { setLoading(false); }
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  const openMessage = async (msg: Message) => {
    setSelected(msg);
    if (!msg.is_read && msg.receiver === me?.id) {
      try { await messagesAPI.markRead(msg.id); load(); } catch { /* ignore */ }
    }
  };

  const handleSend = async () => {
    if (!newMsg.receiver || !newMsg.body.trim()) return;
    setSending(true);
    try {
      await messagesAPI.send(newMsg);
      showToast("Message sent.", "success");
      setComposeOpen(false);
      setNewMsg({ receiver: "", subject: "", body: "" });
      load();
    } catch (err) { showToast(extractError(err), "error"); }
    finally { setSending(false); }
  };

  // Load admin users when composing
  const openCompose = async () => {
    try {
      const { data } = await authAPI.getProfile();
      // We need to find admins to message — fetch from patients endpoint workaround
      // In practice the admin's UUID is stored in received messages
      const adminIds = new Set(messages.map((m) => m.sender === me?.id ? m.receiver : m.sender));
      const adminList = messages
        .filter((m) => adminIds.has(m.sender !== me?.id ? m.sender : m.receiver))
        .map((m) => m.sender !== me?.id
          ? { id: m.sender, full_name: m.sender_name, email: "" }
          : { id: m.receiver, full_name: m.receiver_name, email: "" }
        );
      // Deduplicate
      const seen = new Set<string>();
      const unique = adminList.filter((a) => { if (seen.has(a.id)) return false; seen.add(a.id); return true; });
      setAdmins(unique);
    } catch { /* ignore */ }
    setComposeOpen(true);
  };

  return (
    <PageLayout title="Messages">
      <div className="p-6 h-[calc(100vh-120px)] flex gap-4">
        {/* Thread list */}
        <div className="w-72 flex-shrink-0 bg-white rounded-xl border border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center">
            <span className="font-semibold text-gray-700 text-sm">Messages</span>
            <button onClick={openCompose} className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700">+ New</button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <p className="p-4 text-sm text-gray-400">Loading…</p>
            ) : messages.length === 0 ? (
              <div className="p-4 text-center">
                <p className="text-sm text-gray-400 mb-2">No messages yet.</p>
                <button onClick={openCompose} className="text-sm text-blue-600 hover:underline">Send your first message</button>
              </div>
            ) : (
              messages.map((msg) => {
                const isUnread = !msg.is_read && msg.receiver === me?.id;
                return (
                  <button key={msg.id} onClick={() => openMessage(msg)}
                    className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${selected?.id === msg.id ? "bg-blue-50" : ""}`}>
                    <div className="flex justify-between items-center">
                      <span className={`text-sm truncate ${isUnread ? "font-bold text-gray-900" : "text-gray-700"}`}>
                        {msg.sender === me?.id ? `To: ${msg.receiver_name}` : msg.sender_name}
                      </span>
                      {isUnread && <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />}
                    </div>
                    <p className="text-xs text-gray-500 truncate">{msg.subject || "(No subject)"}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatDateTime(msg.created_at)}</p>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Message body */}
        <div className="flex-1 bg-white rounded-xl border border-gray-200 flex flex-col">
          {selected ? (
            <>
              <div className="p-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-800">{selected.subject || "(No subject)"}</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {selected.sender === me?.id ? `To: ${selected.receiver_name}` : `From: ${selected.sender_name}`}
                  <span className="ml-2">{formatDateTime(selected.created_at)}</span>
                </p>
              </div>
              <MessagePanel
                messages={[{ id: selected.id, sender_name: selected.sender_name, body: selected.body, created_at: selected.created_at, is_mine: selected.sender === me?.id }]}
                onSend={() => {}} showInput={false} />
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
              <span className="text-4xl mb-3">💬</span>
              <p className="text-sm">Select a message or compose a new one</p>
              <button onClick={openCompose} className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Compose</button>
            </div>
          )}
        </div>
      </div>

      {/* Compose modal */}
      <Modal open={composeOpen} onClose={() => setComposeOpen(false)} title="New Message" size="md">
        <div className="space-y-3 text-sm">
          <div>
            <label className="block font-medium text-gray-700 mb-1">To (Admin)</label>
            {admins.length > 0 ? (
              <select value={newMsg.receiver} onChange={(e) => setNewMsg((p) => ({ ...p, receiver: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select admin…</option>
                {admins.map((a) => <option key={a.id} value={a.id}>{a.full_name}</option>)}
              </select>
            ) : (
              <input type="text" value={newMsg.receiver} onChange={(e) => setNewMsg((p) => ({ ...p, receiver: e.target.value }))}
                placeholder="Admin user UUID"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            )}
          </div>
          <div>
            <label className="block font-medium text-gray-700 mb-1">Subject</label>
            <input type="text" value={newMsg.subject} onChange={(e) => setNewMsg((p) => ({ ...p, subject: e.target.value }))}
              placeholder="What's this about?"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block font-medium text-gray-700 mb-1">Message</label>
            <textarea rows={5} value={newMsg.body} onChange={(e) => setNewMsg((p) => ({ ...p, body: e.target.value }))}
              placeholder="Type your message…"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setComposeOpen(false)} className="px-4 py-2 border border-gray-300 rounded-lg">Cancel</button>
            <button onClick={handleSend} disabled={sending || !newMsg.body.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300">
              {sending ? "Sending…" : "Send"}
            </button>
          </div>
        </div>
      </Modal>
    </PageLayout>
  );
}
