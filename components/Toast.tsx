"use client";

import { useEffect, useState, createContext, useContext, useCallback } from "react";
import {
  FiCheckCircle,
  FiAlertCircle,
  FiInfo,
  FiAlertTriangle,
  FiX,
} from "react-icons/fi";

type ToastType = "success" | "error" | "info" | "warning";

interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

const icons: Record<ToastType, React.ReactNode> = {
  success: <FiCheckCircle className="w-5 h-5 text-green-500" />,
  error: <FiAlertCircle className="w-5 h-5 text-red-500" />,
  info: <FiInfo className="w-5 h-5 text-blue-500" />,
  warning: <FiAlertTriangle className="w-5 h-5 text-yellow-500" />,
};

const styles: Record<ToastType, string> = {
  success: "border-l-4 border-green-500 bg-white",
  error: "border-l-4 border-red-500 bg-white",
  info: "border-l-4 border-blue-500 bg-white",
  warning: "border-l-4 border-yellow-500 bg-white",
};

function ToastItem({
  toast,
  onRemove,
}: {
  toast: ToastItem;
  onRemove: (id: string) => void;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    const show = setTimeout(() => setVisible(true), 10);
    const hide = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onRemove(toast.id), 300);
    }, toast.duration ?? 4000);

    return () => {
      clearTimeout(show);
      clearTimeout(hide);
    };
  }, [toast, onRemove]);

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 rounded-xl shadow-modal ${styles[toast.type]}
        transition-all duration-300 ${
          visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
        }`}
    >
      {icons[toast.type]}
      <p className="text-sm text-gray-800 flex-1 pr-2">{toast.message}</p>
      <button
        onClick={() => {
          setVisible(false);
          setTimeout(() => onRemove(toast.id), 300);
        }}
        className="text-gray-400 hover:text-gray-600 transition-colors mt-0.5"
      >
        <FiX className="w-4 h-4" />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = "info", duration = 4000) => {
      const id = `toast-${Date.now()}-${Math.random()}`;
      setToasts((prev) => [...prev, { id, type, message, duration }]);
    },
    []
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)]">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
