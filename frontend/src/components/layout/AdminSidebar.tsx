import { useAuth } from "@/contexts/AuthContext"
import { cn } from "@/lib/utils"
import {
  CircleDollarSign,
  Coins,
  LayoutDashboard,
  LogOut,
  Plus,
  ScrollText,
  Shield,
} from "lucide-react"
import { Link, useLocation } from "react-router-dom"

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/coins", label: "Gerenciar Moedas", icon: CircleDollarSign },
  { href: "/admin/coins/new", label: "Adicionar Moeda", icon: Plus },
  { href: "/admin/audit-logs", label: "Logs de Auditoria", icon: ScrollText },
  { href: "/admin/security", label: "Segurança", icon: Shield },
]

export function AdminSidebar() {
  const location = useLocation()
  const { logout } = useAuth()

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar border-r border-sidebar-border">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar-primary/20">
            <Coins className="h-5 w-5 text-sidebar-primary" />
          </div>
          <span className="font-display text-xl font-semibold text-sidebar-foreground">
            Numis<span className="text-sidebar-primary">Admin</span>
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="border-t border-sidebar-border p-4">
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-destructive transition-colors"
          >
            <LogOut className="h-5 w-5" />
            Sair
          </button>
        </div>
      </div>
    </aside>
  )
}
