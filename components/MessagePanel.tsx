"use client";

import { FiUser } from "react-icons/fi";
import { formatDateTime } from "@/lib/utils";

interface Message {
  id: string;
  sender_name: string;
  body: string;
  created_at: string;
  is_mine: boolean;
}

interface MessagePanelProps {
  messages: Message[];
  onSend: () => void;
  showInput?: boolean;
}

export default function MessagePanel({ messages }: MessagePanelProps) {
  return (
    <div className="flex flex-col gap-3 p-4 overflow-y-auto flex-1">
      {messages.map((msg) => (
        <div key={msg.id} className={`flex gap-3 ${msg.is_mine ? "flex-row-reverse" : "flex-row"}`}>
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <FiUser className="w-4 h-4 text-blue-600" />
          </div>
          <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${msg.is_mine ? "bg-blue-600 text-white rounded-tr-sm" : "bg-gray-100 text-gray-900 rounded-tl-sm"}`}>
            <p className="text-xs font-medium mb-0.5 opacity-70">{msg.sender_name}</p>
            <p className="text-sm leading-relaxed">{msg.body}</p>
            <p className="text-xs mt-1 opacity-60 text-right">{formatDateTime(msg.created_at)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
