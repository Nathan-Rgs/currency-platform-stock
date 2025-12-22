import { Toaster as Sonner } from "@/components/ui/sonner"
import { Toaster } from "@/components/ui/toaster"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AuthProvider } from "@/contexts/AuthContext"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter, Route, Routes } from "react-router-dom"
import { AdminLayout } from "./components/layout/AdminLayout"
import AuditLogsPage from "./pages/admin/AuditLogs"
import CoinForm from "./pages/admin/CoinForm"
import CoinsList from "./pages/admin/CoinsList"
import AdminDashboard from "./pages/admin/Dashboard"
import AdminLogin from "./pages/admin/Login"
import SecurityPage from "./pages/admin/Security"
import CoinDetail from "./pages/CoinDetail"
import Index from "./pages/Index"
import NotFound from "./pages/NotFound"

const queryClient = new QueryClient()

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
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
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
)

export default App
