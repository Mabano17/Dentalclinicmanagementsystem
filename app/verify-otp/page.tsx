"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FiShield, FiMail, FiActivity } from "react-icons/fi";
import { authAPI } from "@/lib/api";
import { setTokens, setUser, getRedirectPath } from "@/lib/auth";
import { extractError } from "@/lib/utils";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60; // seconds

export default function VerifyOTPPage() {
  const router = useRouter();
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const email =
    typeof window !== "undefined"
      ? sessionStorage.getItem("otp_email") ?? ""
      : "";

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) {
      setCanResend(true);
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // Redirect if no email in session
  useEffect(() => {
    if (!email) {
      router.replace("/login");
    }
  }, [email, router]);

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleChange = (value: string, index: number) => {
    // Allow only digits
    const digit = value.replace(/\D/g, "").slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    setError("");

    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (pasted.length === OTP_LENGTH) {
      setOtp(pasted.split(""));
      inputRefs.current[OTP_LENGTH - 1]?.focus();
    }
  };

  const handleVerify = useCallback(async () => {
    const code = otp.join("");
    if (code.length < OTP_LENGTH) {
      setError("Please enter the complete 6-digit OTP.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { data } = await authAPI.verifyOTP({ email, otp: code });
      if (data.access) {
        setTokens(data.access, data.refresh);
        setUser(data.user);
        sessionStorage.removeItem("otp_email");
        sessionStorage.removeItem("otp_purpose");
        setSuccess("OTP verified! Redirecting…");
        setTimeout(() => router.push(getRedirectPath(data.user.role)), 1000);
      } else {
        setSuccess("Account activated! Please login.");
        setTimeout(() => router.push("/login"), 1500);
      }
    } catch (err) {
      setError(extractError(err));
      setOtp(Array(OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  }, [otp, email, router]);

  // Auto-submit when all digits entered
  useEffect(() => {
    if (otp.every((d) => d !== "")) {
      handleVerify();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp]);

  const handleResend = async () => {
    if (!canResend) return;
    setResending(true);
    setError("");
    try {
      await authAPI.resendOTP({ email });
      setSuccess("A new OTP has been sent to your email.");
      setCountdown(RESEND_COOLDOWN);
      setCanResend(false);
      setOtp(Array(OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(extractError(err));
    } finally {
      setResending(false);
    }
  };

  const maskedEmail = email
    ? email.replace(/(.{2})(.*)(@.*)/, (_, a, b, c) => a + "*".repeat(b.length) + c)
    : "";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-teal-50 p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-teal-500 flex items-center justify-center">
            <FiActivity className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900">DentalCare</span>
        </div>

        <div className="card text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <FiShield className="w-8 h-8 text-blue-600" />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Verify Your OTP
          </h2>
          <p className="text-gray-500 text-sm mb-1">
            We sent a 6-digit code to
          </p>
          <div className="flex items-center justify-center gap-1.5 text-gray-700 font-medium text-sm mb-6">
            <FiMail className="w-4 h-4 text-blue-500" />
            {maskedEmail}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-4">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm mb-4">
              {success}
            </div>
          )}

          {/* OTP Inputs */}
          <div className="flex items-center justify-center gap-3 mb-6" onPaste={handlePaste}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(e.target.value, i)}
                onKeyDown={(e) => handleKeyDown(e, i)}
                className={`w-12 h-14 text-center text-xl font-bold rounded-xl border-2 transition-all
                  ${digit ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 bg-white text-gray-900"}
                  focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none`}
                disabled={loading}
              />
            ))}
          </div>

          {/* Countdown */}
          {!canResend && (
            <p className="text-sm text-gray-400 mb-4">
              OTP expires in{" "}
              <span className="font-semibold text-gray-600">{countdown}s</span>
            </p>
          )}

          {/* Verify button */}
          <button
            onClick={handleVerify}
            disabled={loading || otp.some((d) => !d)}
            className="btn-primary btn-lg w-full mb-4"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              "Verify OTP"
            )}
          </button>

          {/* Resend */}
          <p className="text-sm text-gray-500">
            Didn&apos;t receive the code?{" "}
            {canResend ? (
              <button
                onClick={handleResend}
                disabled={resending}
                className="text-blue-600 font-medium hover:underline disabled:opacity-60"
              >
                {resending ? "Sending…" : "Resend OTP"}
              </button>
            ) : (
              <span className="text-gray-400">
                Resend in {countdown}s
              </span>
            )}
          </p>
        </div>

        <p className="text-center text-sm text-gray-400 mt-6">
          Wrong account?{" "}
          <a href="/login" className="text-blue-600 hover:underline">
            Back to Login
          </a>
        </p>
      </div>
    </div>
  );
}
