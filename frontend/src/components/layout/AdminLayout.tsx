import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AdminMobileBar, AdminSidebar } from './AdminSidebar';
import { Suspense, useEffect } from 'react';

export function AdminLayout() {
  const { isAuthenticated, isLoading, checkAuth } = useAuth();
  const location = useLocation();

  useEffect(() => {
    checkAuth();
  }, [location.pathname, checkAuth]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gold border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate
      to={`/admin/login?next=${encodeURIComponent(location.pathname + location.search)}`}
      replace
    />;
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      <AdminMobileBar />
      <main className="min-h-screen p-4 lg:ml-64 lg:p-8">
        <Suspense
          fallback={
            <div className="flex justify-center py-20">
              <div
                role="status"
                aria-label="Carregando"
                className="h-8 w-8 animate-spin rounded-full border-4 border-gold border-t-transparent"
              />
            </div>
          }
        >
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}
