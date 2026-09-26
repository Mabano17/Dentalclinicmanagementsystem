"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getUser, getRedirectPath } from "@/lib/auth";

interface AuthGuardProps {
  children: React.ReactNode;
  role?: "ADMIN" | "PATIENT" | "DENTIST";
}

export default function AuthGuard({ children, role }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const check = async () => {
      const user = await getUser();
      if (!user) {
        router.replace(`/login?next=${encodeURIComponent(pathname)}`);
        return;
      }
      if (role && user.role !== role) {
        router.replace(getRedirectPath(user.role));
        return;
      }
      setReady(true);
    };
    check();
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
