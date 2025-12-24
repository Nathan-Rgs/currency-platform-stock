import { PublicHeader } from "@/components/layout/PublicHeader"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { API_URL, Coin, coinsApi } from "@/lib/api"
import {
  Archive,
  ArrowLeft,
  Boxes,
  Calendar,
  CircleDollarSign,
  HandCoins,
  ImageIcon,
  Info,
  Loader2,
  MapPin,
  ShieldCheck,
  Tag,
} from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { Link, useParams } from "react-router-dom"

type Originality = "original" | "replica" | "unknown" | string

function originalityLabel(value: Originality) {
  const v = String(value ?? "").toLowerCase()
  if (v === "original") return "Original"
  if (v === "replica") return "Réplica"
  if (v === "unknown") return "Desconhecida"
  return value || "—"
}

function originalityBadgeClasses(value: Originality) {
  const v = String(value ?? "").toLowerCase()
  if (v === "original") return "bg-emerald-500/10 text-emerald-700 border-0"
  if (v === "replica") return "bg-orange-500/10 text-orange-700 border-0"
  return "bg-muted text-muted-foreground border-0"
}

function formatCurrencyBRL(value: number) {
  return `R$ ${Number(value ?? 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function formatDateTime(iso?: string | null) {
  if (!iso) return "—"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleString("pt-BR")
}

function safeImageUrl(path?: string | null) {
  if (!path) return null
  const p = String(path).trim()
  if (!p || p === "string") return null
  if (p.startsWith("http://") || p.startsWith("https://")) return p
  return `${API_URL.replace(/\/$/, "")}/${p.replace(/^\//, "")}`
}

export default function CoinDetail() {
  const { id } = useParams<{ id: string }>()
  const [coin, setCoin] = useState<Coin | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeImage, setActiveImage] = useState<"front" | "back">("front")
  const [frontFailed, setFrontFailed] = useState(false)
  const [backFailed, setBackFailed] = useState(false)

  useEffect(() => {
    const fetchCoin = async () => {
      if (!id) return

                try {
                  const data: any = await coinsApi.get(parseInt(id))
                  setCoin(data)
                } catch {
                  // If the request fails, navigate back to the home page or show an error
                  // toast({
                  //   title: "Erro",
                  //   description: "Moeda não encontrada.",
                  //   variant: "destructive",
                  // });
                  // navigate("/");
                  setCoin(null) // explicitly set to null to trigger "Coin not found" message
                } finally {
                  setLoading(false)
                }
              }
          
              fetchCoin()
            }, [id])
          
            const images = useMemo(() => {
              const c: any = coin
              return {
                front: safeImageUrl(c?.image_url_front),
                back: safeImageUrl(c?.image_url_back),
              }
            }, [coin])
          
            const activeImageUrl = activeImage === "front" ? images.front : images.back
            const activeFailed = activeImage === "front" ? frontFailed : backFailed
          
            if (loading) {
              return (
                <div className="min-h-screen bg-background">
                  <PublicHeader />
                  <div className="flex items-center justify-center py-32">
                    <Loader2 className="h-8 w-8 animate-spin text-gold" />
                  </div>
                </div>
              )
            }
          
            if (!coin) {
              return (
                <div className="min-h-screen bg-background">
                  <PublicHeader />
                  <div className="container py-20 text-center">
                    <h1 className="font-display text-3xl font-bold">
                      Moeda não encontrada
                    </h1>
                    <Link to="/" className="mt-4 inline-block text-gold hover:underline">
                      Voltar à galeria
                    </Link>
                  </div>
                </div>
              )
            }
          
            const c: any = coin
            const quantity = Number(c.quantity ?? 0)
          
            return (
              <div className="min-h-screen bg-background">
                <PublicHeader />
          
                <main className="container py-12">
                  <Link to="/">
                    <Button variant="ghost" className="mb-8 gap-2">
                      <ArrowLeft className="h-4 w-4" />
                      Voltar à galeria
                    </Button>
                  </Link>
          
                  <div className="grid gap-12 lg:grid-cols-2">
                    {/* Imagens */}
                    <div className="space-y-4">
                      <div className="relative isolate aspect-square overflow-hidden rounded-2xl border border-border bg-secondary shadow-elegant">
                        {activeImageUrl && !activeFailed ? (
                          <img
                            src={activeImageUrl}
                            alt={`${c.country} ${c.year} - ${
                              activeImage === "front" ? "Frente" : "Verso"
                            }`}
                            className="h-full w-full object-cover"
                            onError={() =>
                              activeImage === "front"
                                ? setFrontFailed(true)
                                : setBackFailed(true)
                            }
                          />
                        ) : (
                          <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-muted-foreground">
                            <div className="rounded-xl bg-muted/60 p-4">
                              <ImageIcon className="h-14 w-14 stroke-[1.5] text-foreground/60" />
                            </div>
                            <span className="text-sm">
                              Sem imagem{" "}
                              {activeImage === "front" ? "da frente" : "do verso"}
                            </span>
                          </div>
                        )}
          
                        {/* Badge de quantidade em cima da imagem */}
                        <Badge className="absolute right-3 top-3 bg-gold/90 text-charcoal border-0">
                          {Number.isFinite(quantity) && quantity > 0
                            ? `${quantity} disponível`
                            : "Indisponível"}
                        </Badge>
                      </div>
          
                      <div className="flex gap-4">
                        <button
                          onClick={() => setActiveImage("front")}
                          className={`flex-1 rounded-lg border-2 p-3 transition-all ${
                            activeImage === "front"
                              ? "border-gold bg-gold/10"
                              : "border-border bg-card hover:border-gold/50"
                          }`}
                        >
                          <span className="text-sm font-medium">Frente</span>
                        </button>
                        <button
                          onClick={() => setActiveImage("back")}
                          className={`flex-1 rounded-lg border-2 p-3 transition-all ${
                            activeImage === "back"
                              ? "border-gold bg-gold/10"
                              : "border-border bg-card hover:border-gold/50"
                          }`}
                        >
                          <span className="text-sm font-medium">Verso</span>
                        </button>
                      </div>
          
                      {/* Bloco orientado a compra: confiança/transparência */}
                      <div className="rounded-xl border border-border bg-card p-5">
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/10">
                            <ShieldCheck className="h-5 w-5 text-gold" />
                          </div>
                          <div className="space-y-1">
                            <p className="font-medium">Informações para compra</p>
                            <p className="text-sm text-muted-foreground">
                              As imagens representam a peça real cadastrada. Descrição e
                              notas foram registradas pelo proprietário da coleção.
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Cadastro em: {formatDateTime(c.created_at)} • Atualizado em:{" "}
                              {formatDateTime(c.updated_at)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
          
                    {/* Detalhes */}
                    <div className="space-y-8">
                      <div>
                        <div className="mb-4 flex flex-wrap items-center gap-3">
                          <Badge
                            className={`text-sm ${originalityBadgeClasses(
                              c.originality
                            )}`}
                          >
                            {originalityLabel(c.originality)}
                          </Badge>
          
                          {c.condition ? (
                            <Badge variant="secondary" className="text-sm">
                              {c.condition}
                            </Badge>
                          ) : null}
          
                          {c.category ? (
                            <Badge variant="secondary" className="text-sm">
                              {c.category}
                            </Badge>
                          ) : null}
          
                          {/* Badge de disponibilidade no header */}
                          <Badge variant="secondary" className="text-sm">
                            {Number.isFinite(quantity) && quantity > 0
                              ? `${quantity} disponível`
                              : "Indisponível"}
                          </Badge>
                        </div>
          
                        <h1 className="font-display text-4xl font-bold text-foreground lg:text-5xl">
                          {c.title}
                        </h1>
          
                        <p className="mt-2 text-xl text-muted-foreground">
                          {c.country ?? "—"} {c.face_value ?? "—"} {c.year ? `• ${c.year}` : ""}
                        </p>
                      </div>
          
                      {/* Cards principais para compra */}
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="rounded-xl border border-border bg-card p-5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/10">
                              <Calendar className="h-5 w-5 text-gold" />
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Ano</p>
                              <p className="font-display text-xl font-semibold">
                                {c.year ?? "—"}
                              </p>
                            </div>
                          </div>
                        </div>
          
                        <div className="rounded-xl border border-border bg-card p-5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/10">
                              <MapPin className="h-5 w-5 text-gold" />
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">País</p>
                              <p className="font-display text-xl font-semibold">
                                {c.country ?? "—"}
                              </p>
                            </div>
                          </div>
                        </div>
          
                        {/* NOVO: disponibilidade como card */}
                        <div className="rounded-xl border border-border bg-card p-5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/10">
                              <Boxes className="h-5 w-5 text-gold" />
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">
                                Quantidade disponível
                              </p>
                              <p className="font-display text-xl font-semibold">
                                {Number.isFinite(quantity) && quantity > 0
                                  ? quantity
                                  : "0"}
                              </p>
                            </div>
                          </div>
                        </div>
          
                        <div className="rounded-xl border border-gold bg-gold/5 p-5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/20">
                              <CircleDollarSign className="h-5 w-5 text-gold" />
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">
                                Valor estimado
                              </p>
                              <p className="font-display text-2xl font-bold text-gold">
                                {formatCurrencyBRL(Number(c.estimated_value ?? 0))}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                (Estimativa informativa; preço de venda pode variar)
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
          
                      {/* Ficha técnica */}
                      <div className="rounded-xl border border-border bg-card p-6">
                        <div className="mb-4 flex items-center gap-2">
                          <Info className="h-5 w-5 text-gold" />
                          <h2 className="font-display text-xl font-semibold">
                            Ficha técnica
                          </h2>
                        </div>
          
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="flex items-start gap-3">
                            <Tag className="mt-0.5 h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">Categoria</p>
                              <p className="font-medium">{c.category ?? "—"}</p>
                            </div>
                          </div>
          
                          <div className="flex items-start gap-3">
                            <HandCoins className="mt-0.5 h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">
                                Originalidade
                              </p>
                              <p className="font-medium">
                                {originalityLabel(c.originality)}
                              </p>
                            </div>
                          </div>
          
                          {/* NOVO: quantidade na ficha técnica */}
                          <div className="flex items-start gap-3">
                            <Boxes className="mt-0.5 h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">
                                Quantidade disponível
                              </p>
                              <p className="font-medium">
                                {Number.isFinite(quantity) && quantity > 0
                                  ? quantity
                                  : "0"}
                              </p>
                            </div>
                          </div>
          
                          <div className="flex items-start gap-3">
                            <Archive className="mt-0.5 h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">
                                Local de armazenamento
                              </p>
                              <p className="font-medium">{c.storage_location ?? "—"}</p>
                            </div>
                          </div>
          
                          <div className="flex items-start gap-3">
                            <Calendar className="mt-0.5 h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">Aquisição</p>
                              <p className="font-medium">{c.acquisition_source ?? "—"}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatDateTime(c.acquisition_date)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
          
                      {c.notes ? (
                        <div className="rounded-xl border border-border bg-card p-6">
                          <h2 className="mb-3 font-display text-xl font-semibold">
                            Observações do proprietário
                          </h2>
                          <p className="leading-relaxed text-muted-foreground">
                            {c.notes}
                          </p>
                        </div>
                      ) : null}
          
                      <div className="rounded-xl border border-border bg-card p-6">
                        <h2 className="mb-2 font-display text-xl font-semibold">
                          Interessado em comprar?
                        </h2>
                        <p className="mb-4 text-sm text-muted-foreground">
                          Para negociar, você pode entrar em contato com o vendedor e
                          solicitar mais fotos, vídeo ou detalhes sobre a peça.
                        </p>
          
                        <div className="flex flex-col gap-3 sm:flex-row">
                          <Button variant="gold" className="w-full sm:w-auto">
                            Tenho interesse
                          </Button>
                          <Button variant="outline" className="w-full sm:w-auto">
                            Solicitar mais detalhes
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </main>
              </div>  )
}
