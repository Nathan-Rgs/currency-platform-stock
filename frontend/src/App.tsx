import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import CoinDetail from "./pages/CoinDetail";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const AdminLayout = lazy(() =>
  import("./components/layout/AdminLayout").then((m) => ({
    default: m.AdminLayout,
  })),
);
const AuditLogsPage = lazy(() => import("./pages/admin/AuditLogs"));
const CoinForm = lazy(() => import("./pages/admin/CoinForm"));
const CoinsList = lazy(() => import("./pages/admin/CoinsList"));
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const AdminLogin = lazy(() => import("./pages/admin/Login"));
const SecurityPage = lazy(() => import("./pages/admin/Security"));

const Fallback = () => (
  <div className="flex h-screen items-center justify-center bg-background">
    <div
      role="status"
      aria-label="Carregando"
      className="h-8 w-8 animate-spin rounded-full border-4 border-gold border-t-transparent"
    />
  </div>
);

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<Fallback />}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Index />} />
              <Route path="/coins/:id" element={<CoinDetail />} />
              <Route path="/admin/login" element={<AdminLogin />} />

              {/* Protected Admin Routes */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="coins" element={<CoinsList />} />
                <Route path="coins/new" element={<CoinForm />} />
                <Route path="coins/edit/:id" element={<CoinForm />} />
                <Route path="audit-logs" element={<AuditLogsPage />} />
                <Route path="security" element={<SecurityPage />} />
              </Route>

              {/* Catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
