"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getUser, getAccessToken, isAdmin, isPatient, isDentist } from "@/lib/auth";

interface AuthGuardProps {
  children: React.ReactNode;
  role?: "ADMIN" | "PATIENT" | "DENTIST";
}

export default function AuthGuard({ children, role }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = getAccessToken();
    const user = getUser();

    if (!token || !user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }

    if (role === "ADMIN" && !isAdmin()) {
      router.replace(isPatient() ? "/patient/dashboard" : "/dentist/dashboard");
      return;
    }

    if (role === "PATIENT" && !isPatient()) {
      router.replace(isAdmin() ? "/admin/dashboard" : "/dentist/dashboard");
      return;
    }

    if (role === "DENTIST" && !isDentist()) {
      router.replace(isAdmin() ? "/admin/dashboard" : "/patient/dashboard");
      return;
    }

    setReady(true);
  }, [router, pathname, role]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  return <>{children}</>;
}
