"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { authAPI } from "@/lib/api";
import { extractError } from "@/lib/utils";

// purpose=REGISTRATION → verify account activation
// purpose=LOGIN       → (not used here; login OTP is handled inside /login)
function VerifyOTPContent() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email") ?? "";
  const purpose = (params.get("purpose") ?? "REGISTRATION").toUpperCase();

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const otpValue = otp.join("");

  const handleChange = (i: number, val: string) => {
    const v = val.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[i] = v;
    setOtp(next);
    if (v && i < 5) inputs.current[i + 1]?.focus();
    if (!v && i > 0) inputs.current[i - 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) {
      inputs.current[i - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      inputs.current[5]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpValue.length !== 6) return;
    setError("");
    setLoading(true);
    try {
      const { data } = await authAPI.verifyOTP({ email, otp: otpValue });
      if (data.success) {
        setSuccess(data.message);
        setTimeout(() => router.push("/login"), 1800);
      }
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    setError("");
    setSuccess("");
    try {
      await authAPI.resendOTP({ email, purpose });
      setSuccess("A new OTP has been sent to your email.");
      setCountdown(60);
    } catch (err) {
      setError(extractError(err));
    } finally {
      setResendLoading(false);
    }
  };

  const purposeLabel: Record<string, string> = {
    REGISTRATION: "Account Verification",
    PASSWORD_RESET: "Password Reset",
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-600 text-white text-2xl mb-3">
            📧
          </div>
          <h1 className="text-2xl font-bold text-gray-800">
            {purposeLabel[purpose] ?? "Verify OTP"}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Enter the 6-digit code sent to
          </p>
          <p className="font-semibold text-gray-700 text-sm">{email}</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm text-center">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm text-center">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* OTP boxes */}
          <div className="flex gap-2 justify-center mb-6" onPaste={handlePaste}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="w-12 h-12 text-center text-xl font-bold border-2 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={loading || otpValue.length !== 6}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg font-medium text-sm transition-colors"
          >
            {loading ? "Verifying…" : "Verify OTP"}
          </button>
        </form>

        <div className="mt-4 text-center">
          {countdown > 0 ? (
            <p className="text-sm text-gray-500">Resend in {countdown}s</p>
          ) : (
            <button
              onClick={handleResend}
              disabled={resendLoading}
              className="text-sm text-blue-600 hover:underline disabled:opacity-50"
            >
              {resendLoading ? "Sending…" : "Resend OTP"}
            </button>
          )}
        </div>

        <p className="text-center text-sm text-gray-500 mt-4">
          <Link href="/login" className="text-blue-600 hover:underline">
            ← Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function VerifyOTPPage() {
  return (
    <Suspense>
      <VerifyOTPContent />
    </Suspense>
  );
}
