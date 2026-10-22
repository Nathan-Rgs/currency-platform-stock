import { CoinPublic } from "@/lib/api"
import { formatBRL, resolveImageUrl } from "@/lib/coin-format"
import { ImageIcon } from "lucide-react"
import { useState } from "react"
import { Link } from "react-router-dom"

export function CoinCard({ coin }: { coin: CoinPublic }) {
  const front = resolveImageUrl(coin.image_url_front)
  const back = resolveImageUrl(coin.image_url_back)
  const [frontFailed, setFrontFailed] = useState(false)
  const [backFailed, setBackFailed] = useState(false)
  const showFront = !!front && !frontFailed
  const showBack = showFront && !!back && !backFailed

  return (
    <Link
      to={`/coins/${coin.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl bg-card shadow-elegant transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="coin-stage relative flex h-[220px] items-center justify-center p-4">
        {showFront ? (
          <>
            <img
              src={front}
              alt={`${coin.title}, frente`}
              loading="lazy"
              onError={() => setFrontFailed(true)}
              className={`h-full w-full object-contain transition-opacity duration-300 ${
                showBack ? "group-hover:opacity-0" : ""
              }`}
            />
            {showBack && (
              <img
                src={back}
                alt={`${coin.title}, verso`}
                loading="lazy"
                onError={() => setBackFailed(true)}
                className="absolute inset-4 h-[calc(100%-2rem)] w-[calc(100%-2rem)] object-contain opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              />
            )}
          </>
        ) : (
          <div
            role="img"
            aria-label="Sem foto"
            className="flex h-32 w-32 items-center justify-center rounded-full bg-muted"
          >
            <ImageIcon className="h-10 w-10 text-muted-foreground/50" />
          </div>
        )}
        {coin.for_sale && coin.sale_price != null && (
          <span className="absolute right-3 top-3 rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground">
            {formatBRL(coin.sale_price)}
          </span>
        )}
      </div>
      <div className="flex items-end justify-between gap-2 px-4 pb-4 pt-3.5">
        <div className="min-w-0">
          <h3 className="truncate font-display text-lg font-semibold text-foreground">
            {coin.title}
          </h3>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {coin.country} · {coin.year}
          </p>
        </div>
        {coin.condition && (
          <span className="shrink-0 rounded-md border border-border px-1.5 py-0.5 text-xs text-muted-foreground">
            {coin.condition}
          </span>
        )}
      </div>
    </Link>
  )
}
