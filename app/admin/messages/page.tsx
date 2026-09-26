"use client";

import { useEffect, useState, useCallback } from "react";
import PageLayout from "@/components/PageLayout";
import Modal from "@/components/Modal";
import MessagePanel from "@/components/MessagePanel";
import { messagesAPI } from "@/lib/api";
import { formatDateTime, extractError } from "@/lib/utils";
import { useToast } from "@/components/Toast";
import { getUser } from "@/lib/auth";

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

export default function AdminMessagesPage() {
  const { showToast } = useToast();
  const [me, setMe] = useState<{ id: string } | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => { getUser().then(setMe); }, []);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Message | null>(null);
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
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

  const handleSendReply = async () => {
    if (!replyTo || !body.trim()) return;
    setSending(true);
    try {
      await messagesAPI.send({ receiver: replyTo.id, subject, body });
      showToast("Message sent.", "success");
      setReplyOpen(false);
      setBody(""); setSubject("");
      load();
    } catch (err) { showToast(extractError(err), "error"); }
    finally { setSending(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      await messagesAPI.delete(id);
      showToast("Message deleted.", "success");
      setSelected(null); load();
    } catch (err) { showToast(extractError(err), "error"); }
  };

  return (
    <PageLayout title="Messages">
      <div className="p-6 h-[calc(100vh-120px)] flex gap-4">
        {/* Thread list */}
        <div className="w-80 flex-shrink-0 bg-white rounded-xl border border-gray-200 overflow-y-auto">
          <div className="p-4 border-b border-gray-100 font-semibold text-gray-700 text-sm">
            All Messages ({messages.length})
          </div>
          {loading ? (
            <div className="p-4 text-sm text-gray-400">Loading…</div>
          ) : messages.length === 0 ? (
            <div className="p-4 text-sm text-gray-400">No messages.</div>
          ) : (
            messages.map((msg) => (
              <button key={msg.id} onClick={() => openMessage(msg)}
                className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${selected?.id === msg.id ? "bg-blue-50" : ""}`}>
                <div className="flex justify-between items-start">
                  <span className={`text-sm truncate ${!msg.is_read && msg.receiver === me?.id ? "font-bold text-gray-900" : "text-gray-700"}`}>
                    {msg.sender_name}
                  </span>
                  {!msg.is_read && msg.receiver === me?.id && (
                    <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1" />
                  )}
                </div>
                <p className="text-xs text-gray-500 truncate">{msg.subject || "(No subject)"}</p>
                <p className="text-xs text-gray-400 mt-0.5">{formatDateTime(msg.created_at)}</p>
              </button>
            ))
          )}
        </div>

        {/* Message detail */}
        <div className="flex-1 bg-white rounded-xl border border-gray-200 flex flex-col">
          {selected ? (
            <>
              <div className="p-4 border-b border-gray-100 flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-gray-800">{selected.subject || "(No subject)"}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    From: <strong>{selected.sender_name}</strong> → To: <strong>{selected.receiver_name}</strong>
                    <span className="ml-2">{formatDateTime(selected.created_at)}</span>
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setReplyTo({ id: selected.sender, name: selected.sender_name }); setSubject(`RE: ${selected.subject}`); setReplyOpen(true); }}
                    className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700">Reply</button>
                  <button onClick={() => handleDelete(selected.id)}
                    className="px-3 py-1.5 bg-red-50 text-red-600 text-xs rounded-lg hover:bg-red-100">Delete</button>
                </div>
              </div>
              <MessagePanel messages={[{ id: selected.id, sender_name: selected.sender_name, body: selected.body, created_at: selected.created_at, is_mine: selected.sender === me?.id }]}
                onSend={() => {}} showInput={false} />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
              Select a message to read
            </div>
          )}
        </div>
      </div>

      {/* Reply modal */}
      <Modal open={replyOpen} onClose={() => setReplyOpen(false)} title={`Reply to ${replyTo?.name}`} size="md">
        <div className="space-y-3 text-sm">
          <div>
            <label className="block font-medium text-gray-700 mb-1">Subject</label>
            <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block font-medium text-gray-700 mb-1">Message</label>
            <textarea rows={5} value={body} onChange={(e) => setBody(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setReplyOpen(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm">Cancel</button>
            <button onClick={handleSendReply} disabled={sending || !body.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:bg-blue-300">
              {sending ? "Sending…" : "Send"}
            </button>
          </div>
        </div>
      </Modal>
    </PageLayout>
  );
}
