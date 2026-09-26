"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { setUser, getRedirectPath } from "@/lib/auth";
import { extractError } from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data, error: err } = await supabase.auth.signInWithPassword({
        email: emailOrUsername,
        password,
      });
      if (err) throw err;
      if (data.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, full_name, username, phone_number")
          .eq("id", data.user.id)
          .single();
        const user = {
          id: data.user.id,
          email: data.user.email!,
          full_name: profile?.full_name ?? data.user.user_metadata?.full_name ?? "",
          username: profile?.username ?? data.user.user_metadata?.username ?? "",
          role: (profile?.role ?? data.user.user_metadata?.role ?? "PATIENT") as "ADMIN" | "PATIENT" | "DENTIST",
          phone_number: profile?.phone_number ?? "",
        };
        setUser(user);
        router.push(getRedirectPath(user.role));
      }
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-600 text-white text-2xl mb-3">🦷</div>
          <h1 className="text-2xl font-bold text-gray-800">DentalCare</h1>
          <p className="text-gray-500 text-sm mt-1">Sign in to your account</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
        )}

        <form onSubmit={handleCredentials} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={emailOrUsername}
              onChange={(e) => setEmailOrUsername(e.target.value)}
              required
              placeholder="you@example.com"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <div className="text-right">
            <Link href="/forgot-password" className="text-sm text-blue-600 hover:underline">Forgot password?</Link>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg font-medium text-sm transition-colors"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-blue-600 hover:underline font-medium">Register</Link>
        </p>
      </div>
    </div>
  );
}
