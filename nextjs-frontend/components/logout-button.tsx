"use client";

import { logout } from "./actions/logout-action";
import { useState, ReactNode } from "react";
import { useRouter } from "next/navigation";

interface LogoutButtonProps {
  children: ReactNode;
}

export function LogoutButton({ children }: LogoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      await logout();
      // Force a client-side navigation to ensure we're fully logged out
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div onClick={handleLogout} className={isLoading ? "opacity-70 cursor-not-allowed" : "cursor-pointer"}>
      {children}
    </div>
  );
}
