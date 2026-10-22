import { PublicFooter } from "@/components/layout/PublicFooter"
import { PublicHeader } from "@/components/layout/PublicHeader"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { publicApi } from "@/lib/api"
import { BRAND_NAME } from "@/lib/brand"
import { formatBRL, formatDecimal, originalityLabel, resolveImageUrl } from "@/lib/coin-format"
import { buildContactLinks } from "@/lib/contact"
import { cn } from "@/lib/utils"
import { useQuery } from "@tanstack/react-query"
import { isAxiosError } from "axios"
import { ImageIcon, Loader2, Mail, MessageCircle, Maximize2 } from "lucide-react"
import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"

type Side = "front" | "back"

const chip = "rounded-full px-2.5 py-1 text-xs"

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      {children}
      <PublicFooter />
    </div>
  )
}

export default function CoinDetail() {
  const { id } = useParams<{ id: string }>()
  const [side, setSide] = useState<Side>("front")
  const [zoom, setZoom] = useState(false)
  const [failed, setFailed] = useState<Record<Side, boolean>>({ front: false, back: false })

  const coinId = Number(id)
  const validId = Number.isInteger(coinId)
  const query = useQuery({
    queryKey: ["public-coin", coinId],
    queryFn: () => publicApi.get(coinId),
    enabled: validId,
    retry: (count, err) => !(isAxiosError(err) && err.response?.status === 404) && count < 2,
  })
  const coin = query.data

  useEffect(() => {
    if (coin) document.title = `${coin.title} — ${BRAND_NAME}`
  }, [coin])

  // Reset image state when navigating to another coin.
  useEffect(() => {
    setSide("front")
    setFailed({ front: false, back: false })
  }, [coinId])

  if (validId && query.isPending) {
    return (
      <Shell>
        <div className="flex justify-center py-32" role="status" aria-label="Carregando">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Shell>
    )
  }

  const notFound = !validId || (isAxiosError(query.error) && query.error.response?.status === 404)

  if (notFound) {
    return (
      <Shell>
        <main className="container py-20 text-center">
          <h1 className="font-display text-3xl font-semibold">Moeda não encontrada</h1>
          <Link to="/" className="mt-4 inline-flex min-h-11 items-center text-gold-text underline">
            Voltar à coleção
          </Link>
        </main>
      </Shell>
    )
  }

  if (query.isError || !coin) {
    return (
      <Shell>
        <main className="container py-20 text-center">
          <h1 className="font-display text-3xl font-semibold">Não foi possível carregar a moeda</h1>
          <Button className="mt-4 min-h-11" onClick={() => query.refetch()}>
            Tentar novamente
          </Button>
        </main>
      </Shell>
    )
  }

  const url = resolveImageUrl(side === "front" ? coin.image_url_front : coin.image_url_back)
  const showImage = url && !failed[side]
  const alt = `${coin.title} — ${side === "front" ? "Frente" : "Verso"}`
  const links = coin.for_sale
    ? buildContactLinks(coin, window.location.href)
    : { whatsapp: null, email: null }

  const mm = formatDecimal(coin.diameter_mm)
  const g = formatDecimal(coin.weight_g)
  const specs: [string, string | null | undefined][] = [
    ["Valor de face", coin.face_value],
    ["Material", coin.material],
    ["Diâmetro", mm && `${mm} mm`],
    ["Peso", g && `${g} g`],
    ["Casa da moeda", coin.mint_mark],
    ["Categoria", coin.category],
  ]

  const segment = (active: boolean) =>
    cn(
      "h-11 rounded-full px-5 text-sm transition-colors",
      active
        ? "bg-primary font-medium text-primary-foreground"
        : "text-muted-foreground hover:text-foreground",
    )

  return (
    <Shell>
      <main className="container px-4 py-6 sm:px-8 lg:px-14">
        {/* ponytail: plain link to "/"; browser back already preserves gallery filters */}
        <Link
          to="/"
          className="inline-flex min-h-11 items-center text-sm text-muted-foreground hover:text-foreground"
        >
          ← Coleção
        </Link>

        <div className="mt-2 flex flex-col gap-8 lg:flex-row lg:items-center">
          <div className="flex flex-1 flex-col items-center gap-6">
            <div className="coin-stage flex aspect-square w-full max-w-[520px] items-center justify-center rounded-2xl p-6">
              {showImage ? (
                <img
                  src={url}
                  alt={alt}
                  className="h-full w-full object-contain"
                  onError={() => setFailed((f) => ({ ...f, [side]: true }))}
                />
              ) : (
                <div className="flex flex-col items-center gap-3 text-muted-foreground">
                  <ImageIcon className="h-14 w-14 stroke-[1.5]" aria-hidden="true" />
                  <span className="text-sm">
                    Sem imagem {side === "front" ? "da frente" : "do verso"}
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-1 rounded-full bg-card p-1 shadow-elegant">
              <button
                type="button"
                aria-pressed={side === "front"}
                className={segment(side === "front")}
                onClick={() => setSide("front")}
              >
                Frente
              </button>
              <button
                type="button"
                aria-pressed={side === "back"}
                className={segment(side === "back")}
                onClick={() => setSide("back")}
              >
                Verso
              </button>
              <button
                type="button"
                aria-label="Ampliar foto"
                disabled={!showImage}
                className="flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground hover:text-foreground disabled:opacity-40"
                onClick={() => setZoom(true)}
              >
                <Maximize2 className="h-[18px] w-[18px]" aria-hidden="true" />
              </button>
            </div>
          </div>

          <aside className="flex w-full flex-col gap-6 rounded-2xl bg-card p-6 shadow-[0_1px_2px_rgba(31,36,48,.05),0_20px_40px_rgba(31,36,48,.06)] sm:p-7 lg:w-[440px]">
            <div className="flex flex-wrap gap-1.5">
              <span
                className={cn(
                  chip,
                  coin.originality?.toLowerCase() === "original"
                    ? "bg-success-bg font-semibold text-success"
                    : "bg-secondary text-foreground",
                )}
              >
                {originalityLabel(coin.originality)}
              </span>
              {coin.condition && (
                <span className={cn(chip, "bg-secondary text-foreground")}>{coin.condition}</span>
              )}
              {coin.catalog_ref && (
                <span className={cn(chip, "bg-secondary text-foreground")}>{coin.catalog_ref}</span>
              )}
            </div>

            <div>
              <h1 className="font-display text-[32px] font-semibold leading-tight sm:text-[38px]">
                {coin.title}
              </h1>
              <p className="mt-2 text-base text-muted-foreground">
                {coin.country} · {coin.year}
              </p>
            </div>

            <dl className="grid grid-cols-2 gap-2.5">
              {specs.map(([k, v]) =>
                v ? (
                  <div key={k} className="rounded-xl bg-background px-3.5 py-3">
                    <dt className="text-xs text-muted-foreground">{k}</dt>
                    <dd className="mt-1 text-base font-semibold">{v}</dd>
                  </div>
                ) : null,
              )}
            </dl>

            {coin.public_description && (
              <p className="whitespace-pre-line leading-relaxed text-muted-foreground">
                {coin.public_description}
              </p>
            )}

            {coin.for_sale && (
              <div className="flex flex-col gap-3 border-t border-border pt-5">
                <div className="flex items-baseline justify-between">
                  <span className="text-[13px] text-muted-foreground">À venda</span>
                  <span className="font-display text-4xl font-semibold">
                    {formatBRL(coin.sale_price)}
                  </span>
                </div>
                {links.whatsapp && (
                  <a
                    href={links.whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-[52px] items-center justify-center gap-2 rounded-[14px] bg-accent text-[15px] font-semibold text-accent-foreground hover:bg-accent/90"
                  >
                    <MessageCircle className="h-[18px] w-[18px]" aria-hidden="true" />
                    Negociar pelo WhatsApp
                  </a>
                )}
                {links.email && (
                  <a
                    href={links.email}
                    className="flex h-[46px] items-center justify-center gap-2 rounded-[14px] border border-border text-sm hover:bg-secondary"
                  >
                    <Mail className="h-4 w-4" aria-hidden="true" />
                    Enviar e-mail
                  </a>
                )}
              </div>
            )}
          </aside>
        </div>
      </main>

      <Dialog open={zoom} onOpenChange={setZoom}>
        <DialogContent className="flex max-h-[95vh] w-auto max-w-[95vw] items-center justify-center border-0 bg-transparent p-2 shadow-none sm:rounded-none">
          <DialogTitle className="sr-only">{alt}</DialogTitle>
          {showImage && (
            <img src={url} alt={alt} className="max-h-[90vh] max-w-[90vw] object-contain" />
          )}
        </DialogContent>
      </Dialog>
    </Shell>
  )
}
