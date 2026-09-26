import Cookies from "js-cookie";
import { supabase } from "./supabase";

export interface User {
  id: string;
  full_name: string;
  email: string;
  username: string;
  role: "ADMIN" | "PATIENT" | "DENTIST";
  phone_number?: string;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const register = async (data: {
  full_name: string;
  email: string;
  username: string;
  phone_number?: string;
  password: string;
}) => {
  const { data: authData, error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        full_name: data.full_name,
        username: data.username,
        phone_number: data.phone_number ?? "",
        role: "PATIENT",
      },
    },
  });
  if (error) throw error;
  return authData;
};

export const verifyOTP = async (email: string, token: string) => {
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "signup",
  });
  if (error) throw error;
  return data;
};

export const resendOTP = async (email: string) => {
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
  });
  if (error) throw error;
};

export const login = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
};

export const loginWithOTP = async (email: string) => {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false },
  });
  if (error) throw error;
};

export const verifyLoginOTP = async (email: string, token: string) => {
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "magiclink",
  });
  if (error) throw error;
  return data;
};

export const logout = async () => {
  await supabase.auth.signOut();
  if (typeof window !== "undefined") window.location.href = "/login";
};

export const forgotPassword = async (email: string) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`,
  });
  if (error) throw error;
};

export const resetPassword = async (newPassword: string) => {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
};

// ─── Session / User helpers ───────────────────────────────────────────────────

export const getSession = async () => {
  const { data } = await supabase.auth.getSession();
  return data.session;
};

export const getUser = async (): Promise<User | null> => {
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  const meta = data.user.user_metadata;
  // Also fetch role from profiles table
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, username, phone_number")
    .eq("id", data.user.id)
    .single();
  return {
    id: data.user.id,
    email: data.user.email!,
    full_name: profile?.full_name ?? meta?.full_name ?? "",
    username: profile?.username ?? meta?.username ?? "",
    role: profile?.role ?? meta?.role ?? "PATIENT",
    phone_number: profile?.phone_number ?? meta?.phone_number ?? "",
  };
};

export const isAuthenticated = async (): Promise<boolean> => {
  const session = await getSession();
  return !!session;
};

export const getRedirectPath = (role: string): string => {
  if (role === "ADMIN") return "/admin/dashboard";
  if (role === "DENTIST") return "/dentist/dashboard";
  return "/patient/dashboard";
};

// ─── Legacy cookie helpers (kept for compatibility) ───────────────────────────
export const setTokens = (access: string, refresh: string) => {
  Cookies.set("access_token", access, { expires: 1, sameSite: "strict" });
  Cookies.set("refresh_token", refresh, { expires: 7, sameSite: "strict" });
};
export const getAccessToken = (): string | undefined => Cookies.get("access_token");
export const getRefreshToken = (): string | undefined => Cookies.get("refresh_token");
export const clearTokens = () => {
  Cookies.remove("access_token");
  Cookies.remove("refresh_token");
  Cookies.remove("user");
};
export const setUser = (user: User) =>
  Cookies.set("user", JSON.stringify(user), { expires: 1, sameSite: "strict" });
export const getUserSync = (): User | null => {
  const raw = Cookies.get("user");
  if (!raw) return null;
  try { return JSON.parse(raw) as User; } catch { return null; }
};
export const isAdmin = (): boolean => getUserSync()?.role === "ADMIN";
export const isPatient = (): boolean => getUserSync()?.role === "PATIENT";
export const isDentist = (): boolean => getUserSync()?.role === "DENTIST";
