import { supabase } from "./supabase";

// ─── Generic helpers ──────────────────────────────────────────────────────────

const handleError = (error: unknown) => {
  if (error) throw error;
};

// ─── Auth (re-exported from auth.ts for backward compat) ─────────────────────
export { register, verifyOTP, resendOTP, login, loginWithOTP, verifyLoginOTP, logout, forgotPassword, resetPassword, getUser } from "./auth";

export const authAPI = {
  register: (data: RegisterPayload) =>
    import("./auth").then((m) => m.register(data)),
  verifyOTP: (data: OTPPayload) =>
    import("./auth").then((m) => m.verifyOTP(data.email, data.otp)),
  resendOTP: (data: { email: string }) =>
    import("./auth").then((m) => m.resendOTP(data.email)),
  login: (data: LoginPayload) =>
    import("./auth").then((m) => m.login(data.email_or_username, data.password)),
  verifyLoginOTP: (data: OTPPayload) =>
    import("./auth").then((m) => m.verifyLoginOTP(data.email, data.otp)),
  logout: () => import("./auth").then((m) => m.logout()),
  forgotPassword: (data: { email: string }) =>
    import("./auth").then((m) => m.forgotPassword(data.email)),
  resetPassword: (data: ResetPasswordPayload) =>
    import("./auth").then((m) => m.resetPassword(data.new_password)),
  getProfile: () => import("./auth").then((m) => m.getUser()),
  updateProfile: async (data: Partial<ProfilePayload>) => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error("Not authenticated");
    const { error } = await supabase
      .from("profiles")
      .update(data)
      .eq("id", user.user.id);
    handleError(error);
  },
};

// ─── Patients ─────────────────────────────────────────────────────────────────
export const patientsAPI = {
  getAll: async (params?: Record<string, unknown>) => {
    let query = supabase.from("patients").select("*", { count: "exact" });
    if (params?.search) query = query.ilike("full_name", `%${params.search}%`);
    if (params?.status) query = query.eq("status", params.status);
    if (params?.page) {
      const page = Number(params.page);
      const size = Number(params.page_size ?? 20);
      query = query.range((page - 1) * size, page * size - 1);
    }
    const { data, error, count } = await query.order("created_at", { ascending: false });
    handleError(error);
    return { data: { results: data, count } };
  },
  getOne: async (id: string) => {
    const { data, error } = await supabase.from("patients").select("*").eq("id", id).single();
    handleError(error);
    return { data };
  },
  create: async (data: Record<string, unknown>) => {
    const { data: result, error } = await supabase.from("patients").insert(data).select().single();
    handleError(error);
    return { data: result };
  },
  patch: async (id: string, data: Record<string, unknown>) => {
    const { data: result, error } = await supabase.from("patients").update(data).eq("id", id).select().single();
    handleError(error);
    return { data: result };
  },
  delete: async (id: string) => {
    const { error } = await supabase.from("patients").delete().eq("id", id);
    handleError(error);
  },
};

// ─── Dentists ─────────────────────────────────────────────────────────────────
export const dentistsAPI = {
  getAll: async (params?: Record<string, unknown>) => {
    let query = supabase.from("dentists").select("*", { count: "exact" });
    if (params?.search) query = query.ilike("full_name", `%${params.search}%`);
    if (params?.status) query = query.eq("status", params.status);
    if (params?.page) {
      const page = Number(params.page);
      const size = Number(params.page_size ?? 20);
      query = query.range((page - 1) * size, page * size - 1);
    }
    const { data, error, count } = await query.order("created_at", { ascending: false });
    handleError(error);
    return { data: { results: data, count } };
  },
  getOne: async (id: string) => {
    const { data, error } = await supabase.from("dentists").select("*").eq("id", id).single();
    handleError(error);
    return { data };
  },
  create: async (data: Record<string, unknown>) => {
    const { data: result, error } = await supabase.from("dentists").insert(data).select().single();
    handleError(error);
    return { data: result };
  },
  patch: async (id: string, data: Record<string, unknown>) => {
    const { data: result, error } = await supabase.from("dentists").update(data).eq("id", id).select().single();
    handleError(error);
    return { data: result };
  },
  delete: async (id: string) => {
    const { error } = await supabase.from("dentists").delete().eq("id", id);
    handleError(error);
  },
};

// ─── Services ─────────────────────────────────────────────────────────────────
export const servicesAPI = {
  getAll: async (params?: Record<string, unknown>) => {
    let query = supabase.from("services").select("*", { count: "exact" });
    if (params?.search) query = query.ilike("name", `%${params.search}%`);
    const { data, error, count } = await query.order("name");
    handleError(error);
    return { data: { results: data, count } };
  },
  getOne: async (id: string) => {
    const { data, error } = await supabase.from("services").select("*").eq("id", id).single();
    handleError(error);
    return { data };
  },
  create: async (data: Record<string, unknown>) => {
    const { data: result, error } = await supabase.from("services").insert(data).select().single();
    handleError(error);
    return { data: result };
  },
  patch: async (id: string, data: Record<string, unknown>) => {
    const { data: result, error } = await supabase.from("services").update(data).eq("id", id).select().single();
    handleError(error);
    return { data: result };
  },
  delete: async (id: string) => {
    const { error } = await supabase.from("services").delete().eq("id", id);
    handleError(error);
  },
};

// ─── Appointments ─────────────────────────────────────────────────────────────
export const appointmentsAPI = {
  getAll: async (params?: Record<string, unknown>) => {
    let query = supabase.from("appointments").select(`
      *,
      patient_details:patients(full_name, email),
      dentist_details:dentists(full_name, specialization),
      service_details:services(name, price)
    `, { count: "exact" });
    if (params?.search) query = query.ilike("reason", `%${params.search}%`);
    if (params?.status) query = query.eq("status", params.status);
    if (params?.page) {
      const page = Number(params.page);
      const size = Number(params.page_size ?? 20);
      query = query.range((page - 1) * size, page * size - 1);
    }
    const { data, error, count } = await query.order("appointment_date", { ascending: false });
    handleError(error);
    return { data: { results: data, count } };
  },
  getOne: async (id: string) => {
    const { data, error } = await supabase.from("appointments").select("*, patient_details:patients(full_name,email), dentist_details:dentists(full_name,specialization), service_details:services(name,price)").eq("id", id).single();
    handleError(error);
    return { data };
  },
  create: async (data: Record<string, unknown>) => {
    const { data: result, error } = await supabase.from("appointments").insert(data).select().single();
    handleError(error);
    return { data: result };
  },
  patch: async (id: string, data: Record<string, unknown>) => {
    const { data: result, error } = await supabase.from("appointments").update(data).eq("id", id).select().single();
    handleError(error);
    return { data: result };
  },
  delete: async (id: string) => {
    const { error } = await supabase.from("appointments").delete().eq("id", id);
    handleError(error);
  },
  cancel: async (id: string) => {
    const { data: result, error } = await supabase.from("appointments").update({ status: "CANCELLED" }).eq("id", id).select().single();
    handleError(error);
    return { data: result };
  },
};

// ─── Treatments ───────────────────────────────────────────────────────────────
export const treatmentsAPI = {
  getAll: async (params?: Record<string, unknown>) => {
    let query = supabase.from("treatments").select("*, patient_details:patients(full_name), dentist_details:dentists(full_name), service_details:services(name)", { count: "exact" });
    if (params?.page) {
      const page = Number(params.page);
      const size = Number(params.page_size ?? 20);
      query = query.range((page - 1) * size, page * size - 1);
    }
    const { data, error, count } = await query.order("created_at", { ascending: false });
    handleError(error);
    return { data: { results: data, count } };
  },
  getOne: async (id: string) => {
    const { data, error } = await supabase.from("treatments").select("*").eq("id", id).single();
    handleError(error);
    return { data };
  },
  create: async (data: Record<string, unknown>) => {
    const { data: result, error } = await supabase.from("treatments").insert(data).select().single();
    handleError(error);
    return { data: result };
  },
  patch: async (id: string, data: Record<string, unknown>) => {
    const { data: result, error } = await supabase.from("treatments").update(data).eq("id", id).select().single();
    handleError(error);
    return { data: result };
  },
  delete: async (id: string) => {
    const { error } = await supabase.from("treatments").delete().eq("id", id);
    handleError(error);
  },
};

// ─── Payments ─────────────────────────────────────────────────────────────────
export const paymentsAPI = {
  getAll: async (params?: Record<string, unknown>) => {
    let query = supabase.from("payments").select("*, patient_details:patients(full_name, email)", { count: "exact" });
    if (params?.payment_status) query = query.eq("payment_status", params.payment_status);
    if (params?.payment_method) query = query.eq("payment_method", params.payment_method);
    if (params?.search) query = query.ilike("reference_number", `%${params.search}%`);
    if (params?.page) {
      const page = Number(params.page);
      const size = Number(params.page_size ?? 20);
      query = query.range((page - 1) * size, page * size - 1);
    }
    const { data, error, count } = await query.order("created_at", { ascending: false });
    handleError(error);
    return { data: { results: data, count } };
  },
  getOne: async (id: string) => {
    const { data, error } = await supabase.from("payments").select("*").eq("id", id).single();
    handleError(error);
    return { data };
  },
  create: async (data: Record<string, unknown>) => {
    const { data: result, error } = await supabase.from("payments").insert(data).select().single();
    handleError(error);
    return { data: result };
  },
  patch: async (id: string, data: Record<string, unknown>) => {
    const { data: result, error } = await supabase.from("payments").update(data).eq("id", id).select().single();
    handleError(error);
    return { data: result };
  },
  delete: async (id: string) => {
    const { error } = await supabase.from("payments").delete().eq("id", id);
    handleError(error);
  },
};

// ─── Messages ─────────────────────────────────────────────────────────────────
export const messagesAPI = {
  getAll: async (params?: Record<string, unknown>) => {
    const { data: user } = await supabase.auth.getUser();
    const userId = user.user?.id;
    let query = supabase.from("messages").select("*, sender:profiles!sender_id(full_name), receiver:profiles!receiver_id(full_name)", { count: "exact" })
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);
    if (params?.is_read !== undefined) query = query.eq("is_read", params.is_read);
    const { data, error, count } = await query.order("created_at", { ascending: false });
    handleError(error);
    const results = data?.map((m) => ({
      ...m,
      sender_name: (m.sender as { full_name: string })?.full_name ?? "",
      receiver_name: (m.receiver as { full_name: string })?.full_name ?? "",
    }));
    return { data: { results, count } };
  },
  send: async (data: { receiver: string; subject: string; body: string }) => {
    const { data: user } = await supabase.auth.getUser();
    const { data: result, error } = await supabase.from("messages").insert({
      sender_id: user.user?.id,
      receiver_id: data.receiver,
      subject: data.subject,
      body: data.body,
      is_read: false,
    }).select().single();
    handleError(error);
    return { data: result };
  },
  markRead: async (id: string) => {
    const { error } = await supabase.from("messages").update({ is_read: true }).eq("id", id);
    handleError(error);
  },
  delete: async (id: string) => {
    const { error } = await supabase.from("messages").delete().eq("id", id);
    handleError(error);
  },
};

// ─── Activity Logs ────────────────────────────────────────────────────────────
export const activityLogsAPI = {
  getAll: async (params?: Record<string, unknown>) => {
    let query = supabase.from("activity_logs").select("*, user:profiles(full_name, email)", { count: "exact" });
    if (params?.page) {
      const page = Number(params.page);
      const size = Number(params.page_size ?? 20);
      query = query.range((page - 1) * size, page * size - 1);
    }
    const { data, error, count } = await query.order("created_at", { ascending: false });
    handleError(error);
    return { data: { results: data, count } };
  },
};

// ─── Reports ──────────────────────────────────────────────────────────────────
export const reportsAPI = {
  getDashboard: async () => {
    const [patients, dentists, appointments, payments, treatments] = await Promise.all([
      supabase.from("patients").select("id, status", { count: "exact" }),
      supabase.from("dentists").select("id, status", { count: "exact" }),
      supabase.from("appointments").select("id, status", { count: "exact" }),
      supabase.from("payments").select("id, payment_status, amount", { count: "exact" }),
      supabase.from("treatments").select("id", { count: "exact" }),
    ]);
    const appts = appointments.data ?? [];
    const pays = payments.data ?? [];
    const today = new Date().toISOString().split("T")[0];
    const todayAppts = await supabase.from("appointments").select("id", { count: "exact" }).eq("appointment_date", today);
    const totalRevenue = pays.filter((p) => p.payment_status === "PAID").reduce((s, p) => s + parseFloat(p.amount ?? "0"), 0);
    return {
      data: {
        data: {
          total_patients: patients.count ?? 0,
          active_patients: patients.data?.filter((p) => (p as { status?: string }).status === "ACTIVE").length ?? 0,
          active_dentists: dentists.data?.filter((d) => d.status === "ACTIVE").length ?? 0,
          total_dentists: dentists.count ?? 0,
          total_services: 0,
          total_appointments: appointments.count ?? 0,
          pending_appointments: appts.filter((a) => a.status === "PENDING").length,
          confirmed_appointments: appts.filter((a) => a.status === "CONFIRMED").length,
          completed_appointments: appts.filter((a) => a.status === "COMPLETED").length,
          cancelled_appointments: appts.filter((a) => a.status === "CANCELLED").length,
          todays_appointments: todayAppts.count ?? 0,
          total_revenue: totalRevenue,
          total_treatments: treatments.count ?? 0,
          total_payments: payments.count ?? 0,
          paid_payments: pays.filter((p) => p.payment_status === "PAID").length,
          pending_payments: pays.filter((p) => p.payment_status === "PENDING").length,
        },
      },
    };
  },
  getAppointments: async () => {
    await supabase.from("appointments").select("status, appointment_date");
    return { data: { data: { monthly_statistics: [], status_breakdown: [], top_dentists: [] } } };
  },
  getRevenue: async () => {
    return { data: { data: { monthly_revenue: [], payment_method_breakdown: [] } } };
  },
  getServices: async () => {
    return { data: { data: { popular_services: [] } } };
  },
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
