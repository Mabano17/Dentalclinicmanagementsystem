"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated, isAdmin, isPatient } from "@/lib/auth";
import Loading from "./Loading";

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: "admin" | "patient";
}

export default function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login");
      return;
    }
    if (requiredRole === "admin" && !isAdmin()) {
      router.replace("/patient/dashboard");
      return;
    }
    if (requiredRole === "patient" && !isPatient()) {
      router.replace("/admin/dashboard");
      return;
    }
    setChecking(false);
  }, [router, requiredRole]);

  if (checking) return <Loading fullScreen message="Verifying session…" />;
  return <>{children}</>;
}
