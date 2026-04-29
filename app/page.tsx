'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function Home() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  useEffect(() => {
    router.replace(isAuthenticated ? '/dashboard' : '/login');
  }, [isAuthenticated, router]);
  return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: 'hsl(var(--sidebar))' }}>
      <div className="text-white/40 text-sm">Loading...</div>
    </div>
  );
}
