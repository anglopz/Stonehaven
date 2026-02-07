/**
 * Auth Guard Component - Protected Routes
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks';
import { ROUTES } from '@/lib/constants';
import { LoadingPage } from '@/components/ui';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export function AuthGuard({ children, requireAuth = true }: AuthGuardProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Simulate auth check
    const checkAuth = async () => {
      // In a real app, you might want to verify the session here
      await new Promise((resolve) => setTimeout(resolve, 100));
      setIsChecking(false);
    };

    checkAuth();
  }, []);

  useEffect(() => {
    if (!isChecking) {
      if (requireAuth && !isAuthenticated) {
        router.push(ROUTES.LOGIN);
      }
    }
  }, [isChecking, requireAuth, isAuthenticated, router]);

  if (isChecking) {
    return <LoadingPage />;
  }

  if (requireAuth && !isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
