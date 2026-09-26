import Cookies from "js-cookie";

// Backend returns role as "ADMIN" or "PATIENT" (uppercase)
export interface User {
  id: string;
  full_name: string;
  email: string;
  username: string;
  role: "ADMIN" | "PATIENT" | "DENTIST";
  phone_number?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

// ─── Token helpers ────────────────────────────────────────────────────────────
export const setTokens = (access: string, refresh: string) => {
  Cookies.set("access_token", access, { expires: 1, sameSite: "strict" });
  Cookies.set("refresh_token", refresh, { expires: 7, sameSite: "strict" });
};

export const getAccessToken = (): string | undefined =>
  Cookies.get("access_token");

export const getRefreshToken = (): string | undefined =>
  Cookies.get("refresh_token");

export const clearTokens = () => {
  Cookies.remove("access_token");
  Cookies.remove("refresh_token");
  Cookies.remove("user");
};

// ─── User helpers ─────────────────────────────────────────────────────────────
export const setUser = (user: User) => {
  Cookies.set("user", JSON.stringify(user), {
    expires: 1,
    sameSite: "strict",
  });
};

export const getUser = (): User | null => {
  const raw = Cookies.get("user");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
};

export const isAuthenticated = (): boolean =>
  !!getAccessToken() && !!getUser();

// Backend role is uppercase: "ADMIN" | "PATIENT"
export const isAdmin = (): boolean => getUser()?.role === "ADMIN";
export const isPatient = (): boolean => getUser()?.role === "PATIENT";
export const isDentist = (): boolean => getUser()?.role === "DENTIST";

export const logout = () => {
  clearTokens();
  if (typeof window !== "undefined") window.location.href = "/login";
};

export const getRedirectPath = (role: string): string => {
  if (role === "ADMIN") return "/admin/dashboard";
  if (role === "PATIENT") return "/patient/dashboard";
  if (role === "DENTIST") return "/dentist/dashboard";
  return "/login";
};
