import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { API_URL, Coin } from "@/lib/api"
import { ImageIcon } from "lucide-react"
import { Link } from "react-router-dom"

interface CoinCardProps {
  coin: Coin
}

type Originality = "original" | "replica" | "unknown" | string

function resolveImageUrl(url?: string | null) {
  if (!url) return null
  const u = String(url).trim()
  if (!u || u === "string") return null
  if (u.startsWith("http://") || u.startsWith("https://")) return u
  return `${String(API_URL).replace(/\/$/, "")}/${u.replace(/^\//, "")}`
}

function originalityLabel(value: Originality) {
  const v = String(value ?? "").toLowerCase()
  if (v === "original") return "Original"
  if (v === "replica") return "Réplica"
  if (v === "unknown") return "Desconhecida"
  return value || "—"
}

function formatCurrencyBRL(value?: number | null) {
  return `R$ ${Number(value ?? 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export function CoinCard({ coin }: CoinCardProps) {
  const imageUrl = resolveImageUrl((coin as any).image_url_front)
  const quantity = Number((coin as any).quantity ?? 0)

  return (
    <Link to={`/coins/${coin.id}`}>
      <Card className="group overflow-hidden border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-elegant">
        <div className="relative aspect-square overflow-hidden bg-secondary">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={`${coin.country} ${coin.year}`}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              onError={(e) => {
                // força fallback: remove src inválido
                ;(e.currentTarget as HTMLImageElement).src = ""
              }}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <ImageIcon className="h-16 w-16 text-muted-foreground/30" />
            </div>
          )}

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-charcoal/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

          {/* Originalidade */}
          <Badge className="absolute left-2 top-2 bg-black/60 text-white backdrop-blur border-0">
            {originalityLabel((coin as any).originality)}
          </Badge>

          {/* Quantidade disponível */}
          <Badge className="absolute right-2 top-2 bg-gold/90 text-charcoal border-0">
            {Number.isFinite(quantity) && quantity > 0
              ? `${quantity} disponível`
              : "Indisponível"}
          </Badge>
        </div>

        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="truncate font-display text-lg font-semibold text-foreground">
                {coin.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {coin.country} • {coin.year} • {(coin as any).face_value ?? "—"}
              </p>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              Valor estimado
            </span>
            <span className="font-display text-lg font-semibold text-gold">
              {formatCurrencyBRL((coin as any).estimated_value)}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
