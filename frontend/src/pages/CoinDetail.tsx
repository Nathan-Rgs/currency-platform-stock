import { PublicHeader } from "@/components/layout/PublicHeader"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { API_URL, Coin, coinsApi } from "@/lib/api"
import {
  ArrowLeft,
  Award,
  Calendar,
  CircleDollarSign,
  Loader2,
  MapPin,
} from "lucide-react"
import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"

export default function CoinDetail() {
  const { id } = useParams<{ id: string }>()
  const [coin, setCoin] = useState<Coin | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeImage, setActiveImage] = useState<"front" | "back">("front")

  useEffect(() => {
    const fetchCoin = async () => {
      if (!id) return

      try {
        const data = await coinsApi.get(parseInt(id))
        setCoin(data)
      } catch (err) {
        // Demo data
        setCoin({
          id: parseInt(id),
          country: "Brasil",
          year: 1900,
          face_value: 1,
          currency: "Real",
          estimated_value: 150,
          originality: "Original",
          condition: "Excelente",
          description:
            "Uma moeda brasileira rara do início do século XX. Peça em excelente estado de conservação, com detalhes nítidos e pátina natural.",
          created_at: "",
          updated_at: "",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchCoin()
  }, [id])

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

  const frontImageUrl = coin.image_url_front
    ? `${API_URL}/${coin.image_url_front.replace(/^\//, "")}`
    : null
  const backImageUrl = coin.image_url_back
    ? `${API_URL}/${coin.image_url_back.replace(/^\//, "")}`
    : null
  const activeImageUrl = activeImage === "front" ? frontImageUrl : backImageUrl

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      <main className="container py-12">
        {/* Back button */}
        <Link to="/">
          <Button variant="ghost" className="mb-8 gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar à galeria
          </Button>
        </Link>

        <div className="grid gap-12 lg:grid-cols-2">
          {/* Images */}
          <div className="space-y-4">
            <div className="aspect-square overflow-hidden rounded-2xl border border-border bg-secondary shadow-elegant">
              {activeImageUrl ? (
                <img
                  src={activeImageUrl}
                  alt={`${coin.country} ${coin.year} - ${
                    activeImage === "front" ? "Frente" : "Verso"
                  }`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <CircleDollarSign className="h-32 w-32 text-muted-foreground/20" />
                </div>
              )}
            </div>

            {/* Image selector */}
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
          </div>

          {/* Details */}
          <div className="space-y-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Badge className="bg-gold/10 text-gold-dark border-0 text-sm">
                  {coin.originality}
                </Badge>
                <Badge variant="secondary" className="text-sm">
                  {coin.condition}
                </Badge>
              </div>

              <h1 className="font-display text-4xl font-bold text-foreground lg:text-5xl">
                {coin.country}
              </h1>
              <p className="mt-2 text-xl text-muted-foreground">
                {coin.face_value} {coin.currency}
              </p>
            </div>

            {/* Info cards */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/10">
                    <Calendar className="h-5 w-5 text-gold" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Ano</p>
                    <p className="font-display text-xl font-semibold">
                      {coin.year}
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
                      {coin.country}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/10">
                    <Award className="h-5 w-5 text-gold" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Condição</p>
                    <p className="font-display text-xl font-semibold">
                      {coin.condition}
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
                      Valor Estimado
                    </p>
                    <p className="font-display text-2xl font-bold text-gold">
                      ${coin.estimated_value.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            {coin.description && (
              <div className="rounded-xl border border-border bg-card p-6">
                <h2 className="font-display text-xl font-semibold mb-3">
                  Descrição
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  {coin.description}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
