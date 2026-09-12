"use client";

import { useState } from "react";
import { FiSend, FiUser } from "react-icons/fi";
import { formatDateTime } from "@/lib/utils";
import { messagesAPI } from "@/lib/api";
import { useToast } from "./Toast";

interface Message {
  id: number;
  sender_name: string;
  sender_role: "admin" | "patient";
  content: string;
  created_at: string;
  is_read: boolean;
}

interface MessagePanelProps {
  messages: Message[];
  threadId?: number;
  onMessageSent?: () => void;
  currentRole: "admin" | "patient";
}

export default function MessagePanel({
  messages,
  threadId,
  onMessageSent,
  currentRole,
}: MessagePanelProps) {
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const { showToast } = useToast();

  const handleSend = async () => {
    if (!replyText.trim() || !threadId) return;
    setSending(true);
    try {
      await messagesAPI.reply(threadId, { content: replyText.trim() });
      setReplyText("");
      onMessageSent?.();
      showToast("Message sent.", "success");
    } catch {
      showToast("Failed to send message.", "error");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Messages */}
      <div className="flex flex-col gap-3 max-h-96 overflow-y-auto p-1">
        {messages.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-8">
            No messages yet.
          </p>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.sender_role === currentRole;
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isOwn ? "flex-row-reverse" : "flex-row"}`}
              >
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <FiUser className="w-4 h-4 text-blue-600" />
                </div>
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                    isOwn
                      ? "bg-blue-600 text-white rounded-tr-sm"
                      : "bg-gray-100 text-gray-900 rounded-tl-sm"
                  }`}
                >
                  <p className="text-xs font-medium mb-0.5 opacity-70">
                    {msg.sender_name}
                  </p>
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                  <p className={`text-xs mt-1 opacity-60 text-right`}>
                    {formatDateTime(msg.created_at)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Reply input */}
      {threadId && (
        <div className="flex items-end gap-2 border-t border-gray-100 pt-4">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Type your message…"
            rows={2}
            className="input flex-1 resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <button
            onClick={handleSend}
            disabled={!replyText.trim() || sending}
            className="btn-primary h-10 px-4"
          >
            {sending ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <FiSend className="w-4 h-4" />
            )}
          </button>
        </div>
      )}
    </div>
  );
}
