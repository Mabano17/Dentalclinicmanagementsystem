import { format, parseISO, isValid } from "date-fns";
import clsx, { ClassValue } from "clsx";

// ─── Class name utility ───────────────────────────────────────────────────────
export const cn = (...inputs: ClassValue[]) => clsx(...inputs);

// ─── Currency ─────────────────────────────────────────────────────────────────
export const formatCurrency = (amount: number | string): string => {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "₱0.00";
  return `₱${num.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

// ─── Date / Time ──────────────────────────────────────────────────────────────
export const formatDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return "—";
  try {
    const date = parseISO(dateStr);
    if (!isValid(date)) return dateStr;
    return format(date, "MMM d, yyyy");
  } catch {
    return dateStr;
  }
};

export const formatDateTime = (dateStr: string | null | undefined): string => {
  if (!dateStr) return "—";
  try {
    const date = parseISO(dateStr);
    if (!isValid(date)) return dateStr;
    return format(date, "MMM d, yyyy h:mm a");
  } catch {
    return dateStr;
  }
};

export const formatTime = (timeStr: string | null | undefined): string => {
  if (!timeStr) return "—";
  try {
    // Handle HH:mm:ss or HH:mm
    const [hours, minutes] = timeStr.split(":").map(Number);
    const date = new Date();
    date.setHours(hours, minutes);
    return format(date, "h:mm a");
  } catch {
    return timeStr;
  }
};

// ─── Status badge color ───────────────────────────────────────────────────────
export const getStatusColor = (status: string): string => {
  const s = status?.toLowerCase();
  const map: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
    confirmed: "bg-blue-100 text-blue-800 border-blue-200",
    completed: "bg-green-100 text-green-800 border-green-200",
    cancelled: "bg-red-100 text-red-800 border-red-200",
    paid: "bg-green-100 text-green-800 border-green-200",
    unpaid: "bg-red-100 text-red-800 border-red-200",
    partial: "bg-orange-100 text-orange-800 border-orange-200",
    active: "bg-green-100 text-green-800 border-green-200",
    inactive: "bg-gray-100 text-gray-800 border-gray-200",
    read: "bg-gray-100 text-gray-600 border-gray-200",
    unread: "bg-blue-100 text-blue-700 border-blue-200",
  };
  return map[s] ?? "bg-gray-100 text-gray-700 border-gray-200";
};

// ─── Payment method label ─────────────────────────────────────────────────────
export const paymentMethodLabel = (method: string): string => {
  const map: Record<string, string> = {
    cash: "Cash",
    gcash: "GCash",
    bank_transfer: "Bank Transfer",
    credit_card: "Credit Card",
    debit_card: "Debit Card",
    maya: "Maya",
    check: "Check",
  };
  return map[method?.toLowerCase()] ?? method ?? "—";
};

// ─── Truncate text ────────────────────────────────────────────────────────────
export const truncate = (text: string, maxLength = 60): string => {
  if (!text) return "";
  return text.length > maxLength ? text.slice(0, maxLength) + "…" : text;
};

// ─── Get initials ─────────────────────────────────────────────────────────────
export const getInitials = (name: string): string => {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

// ─── Extract API error message ────────────────────────────────────────────────
export const extractError = (error: unknown): string => {
  if (!error) return "An unexpected error occurred.";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const err = error as any;
  if (err.response?.data) {
    const data = err.response.data;
    if (typeof data === "string") return data;
    if (data.detail) return data.detail;
    if (data.message) return data.message;
    // Collect field errors
    const fieldErrors = Object.entries(data)
      .map(([field, msgs]) => {
        const messages = Array.isArray(msgs) ? msgs.join(", ") : String(msgs);
        return `${field}: ${messages}`;
      })
      .join(" | ");
    if (fieldErrors) return fieldErrors;
  }
  if (err.message) return err.message;
  return "An unexpected error occurred.";
};

// ─── Build query string ───────────────────────────────────────────────────────
export const buildQueryString = (
  params: Record<string, string | number | boolean | undefined | null>
): string => {
  const filtered = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  return filtered.length ? `?${filtered.join("&")}` : "";
};

// ─── Debounce ─────────────────────────────────────────────────────────────────
export const debounce = <T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

// ─── Gender label ─────────────────────────────────────────────────────────────
export const genderLabel = (g: string): string => {
  const map: Record<string, string> = {
    male: "Male",
    female: "Female",
    other: "Other",
    prefer_not_to_say: "Prefer not to say",
  };
  return map[g?.toLowerCase()] ?? g ?? "—";
};
