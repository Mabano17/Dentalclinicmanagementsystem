"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { extractError } from "@/lib/utils";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    full_name: "", email: "", username: "", phone_number: "", password: "", confirm_password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirm_password) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const { error: err } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            full_name: form.full_name,
            username: form.username,
            phone_number: form.phone_number,
            role: "PATIENT",
          },
        },
      });
      if (err) throw err;
      router.push(`/login?registered=1`);
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-600 text-white text-2xl mb-3">🦷</div>
          <h1 className="text-2xl font-bold text-gray-800">Create Account</h1>
          <p className="text-gray-500 text-sm mt-1">Register as a patient</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { name: "full_name", label: "Full Name", type: "text", placeholder: "Juan Dela Cruz" },
            { name: "email", label: "Email Address", type: "email", placeholder: "juan@email.com" },
            { name: "username", label: "Username", type: "text", placeholder: "juan_delacruz" },
            { name: "phone_number", label: "Phone Number", type: "tel", placeholder: "+639181234567" },
            { name: "password", label: "Password", type: "password", placeholder: "Min. 8 characters" },
            { name: "confirm_password", label: "Confirm Password", type: "password", placeholder: "Repeat password" },
          ].map((f) => (
            <div key={f.name}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
              <input
                type={f.type}
                name={f.name}
                value={form[f.name as keyof typeof form]}
                onChange={handleChange}
                placeholder={f.placeholder}
                required={f.name !== "phone_number"}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ))}
          <button type="submit" disabled={loading}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg font-medium text-sm transition-colors">
            {loading ? "Creating account…" : "Create Account"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-blue-600 hover:underline font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
