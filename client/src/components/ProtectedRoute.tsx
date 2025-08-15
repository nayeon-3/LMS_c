import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import type { Role } from '../store/auth';

type Props = {
  children: JSX.Element;
  roles?: Role[];
};

function ProtectedRoute({ children, roles }: Props) {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const location = useLocation();
  const [hydrated, setHydrated] = useState(() =>
    // zustand persist hydration state
    (useAuthStore as any).persist?.hasHydrated?.() ?? true
  );

  useEffect(() => {
    const api = (useAuthStore as any).persist;
    if (api?.hasHydrated?.()) return setHydrated(true);
    const unsub = api?.onFinishHydration?.(() => setHydrated(true));
    return () => { unsub?.(); };
  }, []);

  // Wait until auth store is hydrated to avoid false redirect
  if (!hydrated) {
    return null; // or a spinner
  }

  if (!token || !user) {
    const redirectRole = roles && roles.length > 0 ? roles[0] : 'student';
    return <Navigate to={`/login/${redirectRole}`} state={{ from: location }} replace />;
  }

  if (roles && roles.length > 0 && !roles.includes(user.role)) {
    return <Navigate to={`/login/${roles[0]}`} replace />;
  }

  return children;
}

export default ProtectedRoute;


