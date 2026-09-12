import Cookies from "js-cookie";

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: "admin" | "patient";
  phone_number?: string;
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
  Cookies.set("user", JSON.stringify(user), { expires: 1, sameSite: "strict" });
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

export const isAuthenticated = (): boolean => {
  return !!getAccessToken() && !!getUser();
};

export const isAdmin = (): boolean => {
  const user = getUser();
  return user?.role === "admin";
};

export const isPatient = (): boolean => {
  const user = getUser();
  return user?.role === "patient";
};

export const logout = () => {
  clearTokens();
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
};

export const getRedirectPath = (role: string): string => {
  if (role === "admin") return "/admin/dashboard";
  if (role === "patient") return "/patient/dashboard";
  return "/login";
};
