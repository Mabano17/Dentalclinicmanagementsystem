"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiLock,
  FiEye,
  FiEyeOff,
  FiActivity,
  FiAtSign,
} from "react-icons/fi";
import { authAPI } from "@/lib/api";
import { extractError } from "@/lib/utils";

interface FormState {
  full_name: string;
  email: string;
  phone_number: string;
  username: string;
  password: string;
  confirm_password: string;
}

const initialForm: FormState = {
  full_name: "",
  email: "",
  phone_number: "",
  username: "",
  password: "",
  confirm_password: "",
};

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initialForm);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Partial<FormState>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    setError("");
  };

  const validate = (): boolean => {
    const errors: Partial<FormState> = {};
    if (!form.full_name.trim()) errors.full_name = "Full name is required.";
    if (!form.email.trim()) errors.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errors.email = "Invalid email address.";
    if (!form.phone_number.trim())
      errors.phone_number = "Phone number is required.";
    if (!form.username.trim()) errors.username = "Username is required.";
    if (!form.password) errors.password = "Password is required.";
    else if (form.password.length < 8)
      errors.password = "Password must be at least 8 characters.";
    if (form.password !== form.confirm_password)
      errors.confirm_password = "Passwords do not match.";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setError("");
    try {
      await authAPI.register(form);
      sessionStorage.setItem("otp_email", form.email);
      sessionStorage.setItem("otp_purpose", "registration");
      router.push("/verify-otp");
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    {
      name: "full_name",
      label: "Full Name",
      type: "text",
      placeholder: "Juan dela Cruz",
      icon: FiUser,
      autoComplete: "name",
    },
    {
      name: "email",
      label: "Email Address",
      type: "email",
      placeholder: "juan@example.com",
      icon: FiMail,
      autoComplete: "email",
    },
    {
      name: "phone_number",
      label: "Phone Number",
      type: "tel",
      placeholder: "+63 912 345 6789",
      icon: FiPhone,
      autoComplete: "tel",
    },
    {
      name: "username",
      label: "Username",
      type: "text",
      placeholder: "juandelacruz",
      icon: FiAtSign,
      autoComplete: "username",
    },
  ] as const;

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-2/5 bg-gradient-to-br from-blue-700 via-blue-600 to-teal-500 flex-col items-center justify-center p-12 text-white">
        <div className="max-w-xs text-center">
          <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <FiActivity className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-3">Join DentalCare</h1>
          <p className="text-blue-200 text-sm leading-relaxed">
            Create your account to book appointments, track treatments, and
            manage your dental health with ease.
          </p>
          <div className="mt-8 flex flex-col gap-3 text-left">
            {[
              "Book appointments online",
              "View treatment history",
              "Track payments",
              "Secure messaging with your dentist",
            ].map((feat) => (
              <div key={feat} className="flex items-center gap-2 text-sm text-blue-100">
                <div className="w-1.5 h-1.5 bg-teal-300 rounded-full" />
                {feat}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gray-50 overflow-y-auto">
        <div className="w-full max-w-md py-6">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-6">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-teal-500 flex items-center justify-center">
              <FiActivity className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">DentalCare</span>
          </div>

          <div className="card">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Create Account</h2>
              <p className="text-gray-500 text-sm mt-1">
                Fill in the details below to get started.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                  {error}
                </div>
              )}

              {fields.map((field) => (
                <div key={field.name} className="form-group">
                  <label className="label">{field.label}</label>
                  <div className="relative">
                    <field.icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type={field.type}
                      name={field.name}
                      value={form[field.name]}
                      onChange={handleChange}
                      placeholder={field.placeholder}
                      autoComplete={field.autoComplete}
                      className={`input pl-9 ${
                        fieldErrors[field.name] ? "input-error" : ""
                      }`}
                    />
                  </div>
                  {fieldErrors[field.name] && (
                    <p className="error-text">{fieldErrors[field.name]}</p>
                  )}
                </div>
              ))}

              {/* Password */}
              <div className="form-group">
                <label className="label">Password</label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                    className={`input pl-9 pr-10 ${
                      fieldErrors.password ? "input-error" : ""
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <FiEyeOff className="w-4 h-4" />
                    ) : (
                      <FiEye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="error-text">{fieldErrors.password}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="form-group">
                <label className="label">Confirm Password</label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showConfirm ? "text" : "password"}
                    name="confirm_password"
                    value={form.confirm_password}
                    onChange={handleChange}
                    placeholder="Re-enter your password"
                    autoComplete="new-password"
                    className={`input pl-9 pr-10 ${
                      fieldErrors.confirm_password ? "input-error" : ""
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirm ? (
                      <FiEyeOff className="w-4 h-4" />
                    ) : (
                      <FiEye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {fieldErrors.confirm_password && (
                  <p className="error-text">{fieldErrors.confirm_password}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary btn-lg w-full mt-2"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  "Create Account"
                )}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-6">
              Already have an account?{" "}
              <Link href="/login" className="text-blue-600 font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
