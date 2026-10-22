import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { useAuth } from "@/contexts/AuthContext"
import { BRAND_NAME } from "@/lib/brand"
import { cn } from "@/lib/utils"
import {
  CircleDollarSign,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  ScrollText,
  Shield,
} from "lucide-react"
import { useState } from "react"
import { Link, useLocation } from "react-router-dom"

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/coins", label: "Gerenciar Moedas", icon: CircleDollarSign },
  { href: "/admin/coins/new", label: "Adicionar Moeda", icon: Plus },
  { href: "/admin/audit-logs", label: "Logs de Auditoria", icon: ScrollText },
  { href: "/admin/security", label: "Segurança", icon: Shield },
]

const NEW_COIN = "/admin/coins/new"

function isItemActive(href: string, pathname: string) {
  if (href === NEW_COIN) return pathname === NEW_COIN
  if (href === "/admin/coins" && pathname === NEW_COIN) return false
  return pathname.startsWith(href)
}

const itemClass =
  "flex min-h-11 w-full items-center gap-3 rounded-full px-4 text-sm font-medium transition-colors"
const idleClass =
  "text-muted-foreground hover:bg-muted hover:text-foreground"

function BrandMark() {
  return (
    <span className="flex items-center gap-3">
      <span
        aria-hidden="true"
        className="h-7 w-7 shrink-0 rounded-full"
        style={{
          background:
            "radial-gradient(circle at 35% 30%, #F3E3A6, #C9A227 55%, #8A6A12)",
        }}
      />
      <span className="font-display text-xl font-semibold text-foreground">
        {BRAND_NAME}
      </span>
    </span>
  )
}

/** Nav + gallery link + logout, shared by the desktop sidebar and the mobile sheet. */
function AdminNav({ onNavigate }: { onNavigate?: () => void }) {
  const { pathname } = useLocation()
  const { logout } = useAuth()

  return (
    <div className="flex h-full flex-col">
      <nav aria-label="Admin" className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const active = isItemActive(item.href, pathname)
          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                itemClass,
                active ? "bg-primary text-primary-foreground" : idleClass,
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="space-y-1 border-t border-border p-4">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className={cn(itemClass, idleClass)}
        >
          <ExternalLink className="h-5 w-5" />
          Ver galeria
        </a>
        <button
          type="button"
          onClick={logout}
          className={cn(itemClass, idleClass, "hover:text-destructive")}
        >
          <LogOut className="h-5 w-5" />
          Sair
        </button>
      </div>
    </div>
  )
}

export function AdminSidebar() {
  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 border-r border-border bg-card lg:block">
      <div className="flex h-full flex-col">
        <div className="flex h-16 items-center border-b border-border px-6">
          <BrandMark />
        </div>
        <div className="min-h-0 flex-1">
          <AdminNav />
        </div>
      </div>
    </aside>
  )
}

export function AdminMobileBar() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur lg:hidden">
      <BrandMark />
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11"
            aria-label="Abrir menu"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <div className="flex h-16 items-center border-b border-border px-6">
            <SheetTitle asChild>
              <span>
                <BrandMark />
              </span>
            </SheetTitle>
            <SheetDescription className="sr-only">
              Navegação do painel administrativo
            </SheetDescription>
          </div>
          <div className="h-[calc(100%-4rem)]">
            <AdminNav onNavigate={() => setOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>
    </header>
  )
}
