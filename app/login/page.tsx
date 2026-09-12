"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FiMail, FiLock, FiEye, FiEyeOff, FiActivity } from "react-icons/fi";
import { authAPI } from "@/lib/api";
import { setTokens, setUser, getRedirectPath } from "@/lib/auth";
import { extractError } from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username.trim() || !form.password.trim()) {
      setError("Please enter your credentials.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { data } = await authAPI.login(form);
      // Django may return tokens directly (if no OTP step) or ask for OTP
      if (data.require_otp) {
        // Store email for OTP page
        sessionStorage.setItem("otp_email", data.email ?? form.username);
        sessionStorage.setItem("otp_purpose", "login");
        router.push("/verify-otp");
      } else if (data.access) {
        setTokens(data.access, data.refresh);
        setUser(data.user);
        router.push(getRedirectPath(data.user.role));
      }
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left — branding panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-700 via-blue-600 to-teal-500 flex-col items-center justify-center p-12 text-white">
        <div className="max-w-sm text-center">
          <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
            <FiActivity className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-4">DentalCare</h1>
          <p className="text-xl font-medium text-blue-100 mb-3">
            Clinic Management System
          </p>
          <p className="text-blue-200 text-sm leading-relaxed">
            Manage appointments, patients, treatments, and payments — all in one
            professional platform designed for modern dental clinics.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-4 text-center">
            {[
              { label: "Appointments", value: "Streamlined" },
              { label: "Records", value: "Secure" },
              { label: "Payments", value: "Simple" },
            ].map((item) => (
              <div key={item.label} className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                <p className="text-xs font-semibold text-blue-100">{item.label}</p>
                <p className="text-sm font-bold mt-0.5">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — login form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-teal-500 flex items-center justify-center">
              <FiActivity className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">DentalCare</span>
          </div>

          <div className="card">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
              <p className="text-gray-500 text-sm mt-1">
                Sign in to your account to continue.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                  {error}
                </div>
              )}

              <div className="form-group">
                <label className="label">Email or Username</label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    name="username"
                    value={form.username}
                    onChange={handleChange}
                    placeholder="Enter email or username"
                    className="input pl-9"
                    autoComplete="username"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <div className="flex items-center justify-between mb-1">
                  <label className="label mb-0">Password</label>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    className="input pl-9 pr-10"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? (
                      <FiEyeOff className="w-4 h-4" />
                    ) : (
                      <FiEye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary btn-lg w-full mt-2"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  "Sign In"
                )}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-6">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-blue-600 font-medium hover:underline">
                Create account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
