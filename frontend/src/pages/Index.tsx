import { CoinCard } from "@/components/coins/CoinCard"
import { CoinFilters } from "@/components/coins/CoinFilters"
import { PublicHeader } from "@/components/layout/PublicHeader"
import { Button } from "@/components/ui/button"
import { Coin, coinsApi, PaginatedResponse } from "@/lib/api"
import { ChevronLeft, ChevronRight, Coins, Loader2 } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

/**
 * Alinhado com o payload do seu banco:
 * originality: "original" | "replica" | "unknown"
 * face_value: string (ex: "1 Real")
 * image_url_front/back: string | null
 */
type Originality = "original" | "replica" | "unknown" | "all" | ""

function normalizeOriginality(value: any): "original" | "replica" | "unknown" {
  const v = String(value ?? "").toLowerCase()
  if (v === "original") return "original"
  if (v === "replica") return "replica"
  return "unknown"
}

const Index = () => {
  const [coins, setCoins] = useState<Coin[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
  })

  // Filters (somente o que você tem disponível / faz sentido pro seu modelo)
  const [search, setSearch] = useState("")
  const [country, setCountry] = useState<string>("")
  const [yearFrom, setYearFrom] = useState<string>("")
  const [yearTo, setYearTo] = useState<string>("")
  const [originality, setOriginality] = useState<Originality>("")
  const [countries, setCountries] = useState<string[]>([])

  // Demo data 100% compatível com o payload que você mostrou
  const demoCoins = useMemo(
    () =>
      [
        {
          id: 4,
          owner_id: 3,
          year: 1994,
          country: "Brasil",
          face_value: "1 Real",
          purchase_price: 10.5,
          estimated_value: 25.0,
          originality: "original",
          condition: "Flor de Cunho",
          storage_location: "Álbum 1, p. 3",
          category: "Comemorativa",
          acquisition_date: "2025-12-18T21:47:31.211000",
          acquisition_source: "Herança",
          notes: "Moeda rara do plano Real.",
          image_url_front: "",
          image_url_back: "",
          created_at: "2025-12-18T21:47:21.454233Z",
          updated_at: "2025-12-18T21:47:21.454233Z",
        },
        {
          id: 5,
          owner_id: 3,
          year: 1889,
          country: "Portugal",
          face_value: "20 Réis",
          purchase_price: null,
          estimated_value: 120.0,
          originality: "unknown",
          condition: "Boa",
          storage_location: "Caixa 2",
          category: "Histórica",
          acquisition_date: null,
          acquisition_source: "Colecionador",
          notes: "Peça antiga com marcas do tempo.",
          image_url_front: "",
          image_url_back: "",
          created_at: "2025-12-10T10:00:00.000Z",
          updated_at: "2025-12-10T10:00:00.000Z",
        },
      ] as any as Coin[],
    []
  )

  const mergeCountries = (items: any[]) => {
    const list = (items ?? [])
      .map((c) => c?.country)
      .filter(Boolean)
      .map(String)

    const unique = Array.from(new Set(list)).sort((a, b) => a.localeCompare(b))

    setCountries((prev) => {
      const merged = Array.from(new Set([...(prev ?? []), ...unique]))
      merged.sort((a, b) => a.localeCompare(b))
      return merged
    })
  }

  const fetchCoins = async (page = 1) => {
    setLoading(true)
    setError(null)

    try {
      const params: Record<string, any> = { page, page_size: 12 }

      // filtros do Index => params esperados pelo backend
      if (search.trim()) params.search = search.trim()
      if (country && country !== "all") params.country = country
      if (yearFrom) params.year_from = Number(yearFrom)
      if (yearTo) params.year_to = Number(yearTo)
      if (originality && originality !== "all") {
        params.originality = normalizeOriginality(originality)
      }

      const response: PaginatedResponse<Coin> = await coinsApi.list(params)

      setCoins(response.items ?? [])
      setPagination({
        page: response.page ?? page,
        totalPages: response.total_pages ?? 1,
        total: response.total ?? response.items?.length ?? 0,
      })

      mergeCountries(response.items ?? [])
    } catch (err) {
      setError(
        "Não foi possível carregar as moedas. Verifique se o servidor está funcionando."
      )

      setCoins(demoCoins)
      setPagination({ page: 1, totalPages: 1, total: demoCoins.length })
      mergeCountries(demoCoins as any)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCoins(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // debounce simples
  useEffect(() => {
    const timer = setTimeout(() => fetchCoins(1), 450)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, country, yearFrom, yearTo, originality])

  const clearFilters = () => {
    setSearch("")
    setCountry("")
    setYearFrom("")
    setYearTo("")
    setOriginality("")
  }

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      {/* Hero */}
      <section className="relative overflow-hidden bg-primary py-20">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        <div className="container relative">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-gold/10 px-4 py-2">
              <Coins className="h-5 w-5 text-gold" />
              <span className="text-sm font-medium text-gold">
                Coleção Numismática
              </span>
            </div>

            <h1 className="font-display text-5xl font-bold text-primary-foreground sm:text-6xl">
              Explore moedas e detalhes reais do acervo
            </h1>

            <p className="mt-6 text-lg text-primary-foreground/70">
              Filtre por país, ano e originalidade. Cada item pode ter fotos,
              procedência e observações.
            </p>
          </div>
        </div>
      </section>

      <main className="container py-12">
        {/* Filters (mantendo a interface do seu componente) */}
        <CoinFilters
          search={search}
          onSearchChange={setSearch}
          country={country}
          onCountryChange={setCountry}
          yearFrom={yearFrom}
          onYearFromChange={setYearFrom}
          yearTo={yearTo}
          onYearToChange={setYearTo}
          originality={originality}
          onOriginalityChange={setOriginality}
          onClear={clearFilters}
          countries={countries}
        />

        <div className="mt-8 flex items-center justify-between">
          <p className="text-muted-foreground">
            {pagination.total} moeda{pagination.total !== 1 ? "s" : ""}{" "}
            encontrada{pagination.total !== 1 ? "s" : ""}
          </p>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-gold" />
          </div>
        )}

        {error && !loading && (
          <div className="mt-8 rounded-lg border border-gold/20 bg-gold/5 p-4 text-center text-muted-foreground">
            <p>{error}</p>
            <p className="mt-2 text-sm">Exibindo dados de demonstração</p>
          </div>
        )}

        {!loading && coins.length > 0 && (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {coins.map((coin: any, index) => (
              <div
                key={coin.id}
                className="animate-fadeIn"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* CoinCard deve consumir campos do seu payload:
                    country, year, face_value, estimated_value, originality, image_url_front/back, etc. */}
                <CoinCard coin={coin} />
              </div>
            ))}
          </div>
        )}

        {!loading && coins.length === 0 && (
          <div className="py-20 text-center">
            <Coins className="mx-auto h-16 w-16 text-muted-foreground/30" />
            <h3 className="mt-4 font-display text-xl font-semibold">
              Nenhuma moeda encontrada
            </h3>
            <p className="mt-2 text-muted-foreground">
              Tente ajustar os filtros de busca
            </p>
            <div className="mt-6 flex justify-center">
              <Button variant="outline" onClick={clearFilters}>
                Limpar filtros
              </Button>
            </div>
          </div>
        )}

        {!loading && pagination.totalPages > 1 && (
          <div className="mt-12 flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => fetchCoins(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <span className="px-4 text-sm text-muted-foreground">
              Página {pagination.page} de {pagination.totalPages}
            </span>

            <Button
              variant="outline"
              size="icon"
              onClick={() => fetchCoins(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </main>

      <footer className="border-t border-border bg-card py-8">
        <div className="container text-center text-sm text-muted-foreground">
          <p>© 2025 NumisGallery. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  )
}

export default Index
