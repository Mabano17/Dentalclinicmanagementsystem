import axios, { AxiosInstance, AxiosResponse } from "axios";
import Cookies from "js-cookie";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

// ─── Axios instance ───────────────────────────────────────────────────────────
const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

// Attach JWT on every request
apiClient.interceptors.request.use(
  (config) => {
    const token = Cookies.get("access_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Auto-refresh on 401
apiClient.interceptors.response.use(
  (res: AxiosResponse) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refresh = Cookies.get("refresh_token");
      if (refresh) {
        try {
          const { data } = await axios.post(
            `${API_URL}/auth/token/refresh/`,
            { refresh }
          );
          Cookies.set("access_token", data.access, { expires: 1 });
          if (data.refresh)
            Cookies.set("refresh_token", data.refresh, { expires: 7 });
          original.headers.Authorization = `Bearer ${data.access}`;
          return apiClient(original);
        } catch {
          /* fall through to clear + redirect */
        }
      }
      Cookies.remove("access_token");
      Cookies.remove("refresh_token");
      Cookies.remove("user");
      if (typeof window !== "undefined") window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default apiClient;

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authAPI = {
  /** Step 1 – create account (inactive until OTP verified) */
  register: (data: RegisterPayload) =>
    apiClient.post("/auth/register/", data),

  /** Step 2 – verify registration OTP → activates account */
  verifyOTP: (data: OTPPayload) =>
    apiClient.post("/auth/verify-otp/", data),

  /** Resend OTP (purpose: REGISTRATION | LOGIN | PASSWORD_RESET) */
  resendOTP: (data: { email: string; purpose?: string }) =>
    apiClient.post("/auth/resend-otp/", {
      purpose: "REGISTRATION",
      ...data,
    }),

  /** Step 1 of login – validates credentials, sends login OTP */
  login: (data: LoginPayload) =>
    apiClient.post("/auth/login/", data),

  /** Step 2 of login – verify OTP, returns JWT tokens + user */
  verifyLoginOTP: (data: OTPPayload) =>
    apiClient.post("/auth/verify-login-otp/", data),

  /** Blacklist refresh token */
  logout: (refresh: string) =>
    apiClient.post("/auth/logout/", { refresh }),

  /** Refresh access token */
  refreshToken: (refresh: string) =>
    apiClient.post("/auth/token/refresh/", { refresh }),

  /** Send password-reset OTP */
  forgotPassword: (data: { email: string }) =>
    apiClient.post("/auth/forgot-password/", data),

  /** Verify password-reset OTP */
  verifyPasswordOTP: (data: OTPPayload) =>
    apiClient.post("/auth/verify-password-otp/", data),

  /** Set new password (requires verified OTP) */
  resetPassword: (data: ResetPasswordPayload) =>
    apiClient.post("/auth/reset-password/", data),

  /** Get / PATCH own profile */
  getProfile: () => apiClient.get("/auth/profile/"),
  updateProfile: (data: Partial<ProfilePayload>) =>
    apiClient.patch("/auth/profile/", data),
};

// ─── Patients ─────────────────────────────────────────────────────────────────
export const patientsAPI = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get("/patients/", { params }),
  getOne: (id: string) => apiClient.get(`/patients/${id}/`),
  create: (data: unknown) => apiClient.post("/patients/", data),
  update: (id: string, data: unknown) =>
    apiClient.put(`/patients/${id}/`, data),
  patch: (id: string, data: unknown) =>
    apiClient.patch(`/patients/${id}/`, data),
  delete: (id: string) => apiClient.delete(`/patients/${id}/`),
};

// ─── Dentists ─────────────────────────────────────────────────────────────────
export const dentistsAPI = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get("/dentists/", { params }),
  getOne: (id: string) => apiClient.get(`/dentists/${id}/`),
  create: (data: unknown) => apiClient.post("/dentists/", data),
  update: (id: string, data: unknown) =>
    apiClient.put(`/dentists/${id}/`, data),
  patch: (id: string, data: unknown) =>
    apiClient.patch(`/dentists/${id}/`, data),
  delete: (id: string) => apiClient.delete(`/dentists/${id}/`),
};

// ─── Services ─────────────────────────────────────────────────────────────────
export const servicesAPI = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get("/services/", { params }),
  getOne: (id: string) => apiClient.get(`/services/${id}/`),
  create: (data: unknown) => apiClient.post("/services/", data),
  update: (id: string, data: unknown) =>
    apiClient.put(`/services/${id}/`, data),
  patch: (id: string, data: unknown) =>
    apiClient.patch(`/services/${id}/`, data),
  delete: (id: string) => apiClient.delete(`/services/${id}/`),
};

// ─── Appointments ─────────────────────────────────────────────────────────────
export const appointmentsAPI = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get("/appointments/", { params }),
  getOne: (id: string) => apiClient.get(`/appointments/${id}/`),
  create: (data: unknown) => apiClient.post("/appointments/", data),
  update: (id: string, data: unknown) =>
    apiClient.put(`/appointments/${id}/`, data),
  patch: (id: string, data: unknown) =>
    apiClient.patch(`/appointments/${id}/`, data),
  delete: (id: string) => apiClient.delete(`/appointments/${id}/`),

  // Status helpers — all use PATCH on the same endpoint
  confirm: (id: string, notes?: string) =>
    apiClient.patch(`/appointments/${id}/`, {
      status: "CONFIRMED",
      ...(notes ? { notes } : {}),
    }),
  complete: (id: string, notes?: string) =>
    apiClient.patch(`/appointments/${id}/`, {
      status: "COMPLETED",
      ...(notes ? { notes } : {}),
    }),
  cancel: (id: string, notes?: string) =>
    apiClient.patch(`/appointments/${id}/`, {
      status: "CANCELLED",
      ...(notes ? { notes } : {}),
    }),
};

// ─── Treatments ───────────────────────────────────────────────────────────────
export const treatmentsAPI = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get("/treatments/", { params }),
  getOne: (id: string) => apiClient.get(`/treatments/${id}/`),
  create: (data: unknown) => apiClient.post("/treatments/", data),
  update: (id: string, data: unknown) =>
    apiClient.put(`/treatments/${id}/`, data),
  patch: (id: string, data: unknown) =>
    apiClient.patch(`/treatments/${id}/`, data),
  delete: (id: string) => apiClient.delete(`/treatments/${id}/`),
};

// ─── Payments ─────────────────────────────────────────────────────────────────
export const paymentsAPI = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get("/payments/", { params }),
  getOne: (id: string) => apiClient.get(`/payments/${id}/`),
  create: (data: unknown) => apiClient.post("/payments/", data),
  update: (id: string, data: unknown) =>
    apiClient.put(`/payments/${id}/`, data),
  patch: (id: string, data: unknown) =>
    apiClient.patch(`/payments/${id}/`, data),
  delete: (id: string) => apiClient.delete(`/payments/${id}/`),
};

// ─── Messages ─────────────────────────────────────────────────────────────────
export const messagesAPI = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get("/messages/", { params }),
  getOne: (id: string) =>
    // GET auto-marks as read on backend
    apiClient.get(`/messages/${id}/`),
  send: (data: { receiver: string; subject: string; body: string }) =>
    apiClient.post("/messages/", data),
  markRead: (id: string) =>
    apiClient.patch(`/messages/${id}/`, { is_read: true }),
  delete: (id: string) => apiClient.delete(`/messages/${id}/`),
};

// ─── Activity Logs ────────────────────────────────────────────────────────────
export const activityLogsAPI = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get("/activity-logs/", { params }),
};

// ─── Reports ──────────────────────────────────────────────────────────────────
export const reportsAPI = {
  getDashboard: (params?: Record<string, unknown>) =>
    apiClient.get("/reports/dashboard/", { params }),
  getAppointments: (params?: Record<string, unknown>) =>
    apiClient.get("/reports/appointments/", { params }),
  getRevenue: (params?: Record<string, unknown>) =>
    apiClient.get("/reports/revenue/", { params }),
  getServices: (params?: Record<string, unknown>) =>
    apiClient.get("/reports/services/", { params }),
};

// ─── Type Definitions ─────────────────────────────────────────────────────────
export interface RegisterPayload {
  full_name: string;
  email: string;
  username: string;
  phone_number?: string;
  password: string;
  confirm_password: string;
}

export interface LoginPayload {
  email_or_username: string;
  password: string;
}

export interface OTPPayload {
  email: string;
  otp: string;
}

export interface ResetPasswordPayload {
  email: string;
  otp: string;
  new_password: string;
  confirm_password: string;
}

export interface ProfilePayload {
  full_name: string;
  phone_number: string;
}
