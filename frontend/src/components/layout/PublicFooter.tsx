import { BRAND_NAME } from "@/lib/brand"
import { Link } from "react-router-dom"

export function PublicFooter() {
  return (
    <footer className="mt-16 border-t border-border py-8">
      <div className="container flex flex-col items-center justify-between gap-2 px-4 text-sm text-muted-foreground sm:flex-row sm:px-8 lg:px-14">
        <p>
          © {new Date().getFullYear()} {BRAND_NAME}
        </p>
        <Link
          to="/admin/login"
          className="inline-flex min-h-11 items-center text-xs hover:text-foreground"
        >
          Área do colecionador
        </Link>
      </div>
    </footer>
  )
}
