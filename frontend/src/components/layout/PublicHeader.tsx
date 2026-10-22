import { BRAND_NAME } from "@/lib/brand"
import { cn } from "@/lib/utils"
import { Link, useLocation } from "react-router-dom"

const pill =
  "inline-flex h-11 items-center rounded-full px-4 text-sm font-medium transition-colors"

export function PublicHeader() {
  const { pathname, search } = useLocation()
  const onGallery = pathname === "/"
  const forSale =
    onGallery && new URLSearchParams(search).get("for_sale") === "true"
  const collectionActive = onGallery && !forSale

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur">
      <div className="container flex min-h-[72px] flex-wrap items-center justify-between gap-x-4 px-4 sm:px-8 lg:px-14">
        <Link to="/" className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="h-7 w-7 rounded-full"
            style={{
              background:
                "radial-gradient(circle at 35% 30%, #F3E3A6, #C9A227 55%, #8A6A12)",
            }}
          />
          <span className="font-display text-xl font-semibold text-foreground sm:text-[21px]">
            {BRAND_NAME}
          </span>
        </Link>

        <nav aria-label="Principal" className="flex gap-1.5">
          <Link
            to="/"
            aria-current={collectionActive ? "page" : undefined}
            className={cn(
              pill,
              collectionActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Coleção
          </Link>
          <Link
            to="/?for_sale=true"
            aria-current={forSale ? "page" : undefined}
            className={cn(
              pill,
              forSale
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            À venda
          </Link>
        </nav>
      </div>
    </header>
  )
}
