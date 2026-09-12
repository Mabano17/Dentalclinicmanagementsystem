import axios, { AxiosInstance, AxiosResponse } from "axios";
import Cookies from "js-cookie";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

// Request interceptor — attach JWT access token
apiClient.interceptors.request.use(
  (config) => {
    const token = Cookies.get("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401, attempt token refresh
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = Cookies.get("refresh_token");
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_URL}/auth/token/refresh/`, {
            refresh: refreshToken,
          });
          Cookies.set("access_token", data.access, { expires: 1 });
          originalRequest.headers.Authorization = `Bearer ${data.access}`;
          return apiClient(originalRequest);
        } catch {
          // Refresh failed — clear tokens and redirect
          Cookies.remove("access_token");
          Cookies.remove("refresh_token");
          Cookies.remove("user");
          if (typeof window !== "undefined") {
            window.location.href = "/login";
          }
        }
      } else {
        Cookies.remove("access_token");
        Cookies.remove("refresh_token");
        Cookies.remove("user");
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data: RegisterPayload) =>
    apiClient.post("/auth/register/", data),
  login: (data: LoginPayload) =>
    apiClient.post("/auth/login/", data),
  verifyOTP: (data: OTPPayload) =>
    apiClient.post("/auth/verify-otp/", data),
  resendOTP: (data: { email: string }) =>
    apiClient.post("/auth/resend-otp/", data),
  forgotPassword: (data: { email: string }) =>
    apiClient.post("/auth/forgot-password/", data),
  resetPassword: (data: ResetPasswordPayload) =>
    apiClient.post("/auth/reset-password/", data),
  refreshToken: (refresh: string) =>
    apiClient.post("/auth/token/refresh/", { refresh }),
  logout: () => apiClient.post("/auth/logout/"),
};

// ─── Patients ────────────────────────────────────────────────────────────────
export const patientsAPI = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get("/patients/", { params }),
  getOne: (id: number) =>
    apiClient.get(`/patients/${id}/`),
  create: (data: unknown) =>
    apiClient.post("/patients/", data),
  update: (id: number, data: unknown) =>
    apiClient.put(`/patients/${id}/`, data),
  patch: (id: number, data: unknown) =>
    apiClient.patch(`/patients/${id}/`, data),
  delete: (id: number) =>
    apiClient.delete(`/patients/${id}/`),
  getMe: () =>
    apiClient.get("/patients/me/"),
};

// ─── Dentists ────────────────────────────────────────────────────────────────
export const dentistsAPI = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get("/dentists/", { params }),
  getOne: (id: number) =>
    apiClient.get(`/dentists/${id}/`),
  create: (data: unknown) =>
    apiClient.post("/dentists/", data),
  update: (id: number, data: unknown) =>
    apiClient.put(`/dentists/${id}/`, data),
  patch: (id: number, data: unknown) =>
    apiClient.patch(`/dentists/${id}/`, data),
  delete: (id: number) =>
    apiClient.delete(`/dentists/${id}/`),
};

// ─── Services ────────────────────────────────────────────────────────────────
export const servicesAPI = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get("/services/", { params }),
  getOne: (id: number) =>
    apiClient.get(`/services/${id}/`),
  create: (data: unknown) =>
    apiClient.post("/services/", data),
  update: (id: number, data: unknown) =>
    apiClient.put(`/services/${id}/`, data),
  patch: (id: number, data: unknown) =>
    apiClient.patch(`/services/${id}/`, data),
  delete: (id: number) =>
    apiClient.delete(`/services/${id}/`),
};

// ─── Appointments ─────────────────────────────────────────────────────────────
export const appointmentsAPI = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get("/appointments/", { params }),
  getOne: (id: number) =>
    apiClient.get(`/appointments/${id}/`),
  create: (data: unknown) =>
    apiClient.post("/appointments/", data),
  update: (id: number, data: unknown) =>
    apiClient.put(`/appointments/${id}/`, data),
  patch: (id: number, data: unknown) =>
    apiClient.patch(`/appointments/${id}/`, data),
  delete: (id: number) =>
    apiClient.delete(`/appointments/${id}/`),
  confirm: (id: number) =>
    apiClient.post(`/appointments/${id}/confirm/`),
  complete: (id: number) =>
    apiClient.post(`/appointments/${id}/complete/`),
  cancel: (id: number) =>
    apiClient.post(`/appointments/${id}/cancel/`),
};

// ─── Treatments ───────────────────────────────────────────────────────────────
export const treatmentsAPI = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get("/treatments/", { params }),
  getOne: (id: number) =>
    apiClient.get(`/treatments/${id}/`),
  create: (data: unknown) =>
    apiClient.post("/treatments/", data),
  update: (id: number, data: unknown) =>
    apiClient.put(`/treatments/${id}/`, data),
  patch: (id: number, data: unknown) =>
    apiClient.patch(`/treatments/${id}/`, data),
  delete: (id: number) =>
    apiClient.delete(`/treatments/${id}/`),
};

// ─── Payments ─────────────────────────────────────────────────────────────────
export const paymentsAPI = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get("/payments/", { params }),
  getOne: (id: number) =>
    apiClient.get(`/payments/${id}/`),
  create: (data: unknown) =>
    apiClient.post("/payments/", data),
  update: (id: number, data: unknown) =>
    apiClient.put(`/payments/${id}/`, data),
  patch: (id: number, data: unknown) =>
    apiClient.patch(`/payments/${id}/`, data),
  delete: (id: number) =>
    apiClient.delete(`/payments/${id}/`),
};

// ─── Messages ─────────────────────────────────────────────────────────────────
export const messagesAPI = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get("/messages/", { params }),
  getOne: (id: number) =>
    apiClient.get(`/messages/${id}/`),
  send: (data: unknown) =>
    apiClient.post("/messages/", data),
  reply: (id: number, data: unknown) =>
    apiClient.post(`/messages/${id}/reply/`, data),
  markRead: (id: number) =>
    apiClient.post(`/messages/${id}/mark-read/`),
  delete: (id: number) =>
    apiClient.delete(`/messages/${id}/`),
  getUnreadCount: () =>
    apiClient.get("/messages/unread-count/"),
};

// ─── Activity Logs ────────────────────────────────────────────────────────────
export const activityLogsAPI = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get("/activity-logs/", { params }),
};

// ─── Reports ──────────────────────────────────────────────────────────────────
export const reportsAPI = {
  getSummary: (params?: Record<string, unknown>) =>
    apiClient.get("/reports/summary/", { params }),
  getAppointments: (params?: Record<string, unknown>) =>
    apiClient.get("/reports/appointments/", { params }),
  getRevenue: (params?: Record<string, unknown>) =>
    apiClient.get("/reports/revenue/", { params }),
  getServices: (params?: Record<string, unknown>) =>
    apiClient.get("/reports/services/", { params }),
};

// ─── Dashboard ────────────────────────────────────────────────────────────────
export const dashboardAPI = {
  getAdminStats: () =>
    apiClient.get("/dashboard/admin/"),
  getPatientStats: () =>
    apiClient.get("/dashboard/patient/"),
};

// ─── Type definitions ─────────────────────────────────────────────────────────
export interface RegisterPayload {
  full_name: string;
  email: string;
  phone_number: string;
  username: string;
  password: string;
  confirm_password: string;
}

export interface LoginPayload {
  username: string;
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
