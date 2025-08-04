"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// This is a simple page that redirects to the appropriate page based on auth status
export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Check if we have an access token in client-side cookies
    const accessToken = document.cookie
      .split('; ')
      .find((row) => row.startsWith('accessToken='))
      ?.split('=')[1];
    
    // If there's a token, redirect to dashboard, otherwise to login
    if (accessToken) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  }, [router]);

  // Return a minimal UI while redirecting - NextTopLoader will show a progress bar
  return (
    <div className="min-h-screen bg-background">
      {/* Intentionally empty, NextTopLoader will provide visual feedback */}
    </div>
  );
}
