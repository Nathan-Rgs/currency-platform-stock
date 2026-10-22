import { CoinCard } from "@/components/coins/CoinCard"
import { CoinFilters, FilterValues } from "@/components/coins/CoinFilters"
import { PublicFooter } from "@/components/layout/PublicFooter"
import { PublicHeader } from "@/components/layout/PublicHeader"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { CoinListParams, publicApi } from "@/lib/api"
import { useQuery } from "@tanstack/react-query"
import { ChevronLeft, ChevronRight, Coins } from "lucide-react"
import { useCallback } from "react"
import { useSearchParams } from "react-router-dom"

const PAGE_SIZE = 24

const PARAM_KEYS: Record<keyof FilterValues, string> = {
  search: "search",
  country: "country",
  category: "category",
  yearFrom: "year_from",
  yearTo: "year_to",
  originality: "originality",
  forSale: "for_sale",
  sort: "sort",
}

const Index = () => {
  const [params, setParams] = useSearchParams()

  const values: FilterValues = {
    search: params.get("search") ?? "",
    country: params.get("country") ?? "",
    category: params.get("category") ?? "",
    yearFrom: params.get("year_from") ?? "",
    yearTo: params.get("year_to") ?? "",
    originality: params.get("originality") ?? "",
    forSale: params.get("for_sale") === "true",
    sort: params.get("sort") ?? "",
  }
  const page = Math.max(1, Number(params.get("page")) || 1)

  const onChange = useCallback(
    (patch: Partial<FilterValues>) =>
      setParams((prev) => {
        const next = new URLSearchParams(prev)
        for (const [k, v] of Object.entries(patch)) {
          const key = PARAM_KEYS[k as keyof FilterValues]
          if (v === "" || v === false || v == null) next.delete(key)
          else next.set(key, v === true ? "true" : String(v))
        }
        next.delete("page")
        return next
      }),
    [setParams],
  )

  const setPage = (p: number) =>
    setParams((prev) => {
      const next = new URLSearchParams(prev)
      if (p <= 1) next.delete("page")
      else next.set("page", String(p))
      return next
    })

  const clearFilters = () => setParams(new URLSearchParams())

  const apiParams: CoinListParams = {
    page,
    page_size: PAGE_SIZE,
    search: values.search.trim() || undefined,
    country: values.country || undefined,
    category: values.category || undefined,
    year_from: values.yearFrom ? Number(values.yearFrom) : undefined,
    year_to: values.yearTo ? Number(values.yearTo) : undefined,
    originality: (values.originality || undefined) as CoinListParams["originality"],
    for_sale: values.forSale || undefined,
    sort: (values.sort || undefined) as CoinListParams["sort"],
  }

  const facets = useQuery({
    queryKey: ["public-facets"],
    queryFn: publicApi.facets,
    staleTime: 5 * 60_000,
  })
  const list = useQuery({
    queryKey: ["public-coins", apiParams],
    queryFn: () => publicApi.list(apiParams),
  })

  const coins = list.data?.data ?? []
  const total = list.data?.meta.total_items ?? 0
  const totalPages = list.data?.meta.total_pages ?? 1

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      <main className="container px-4 sm:px-8 lg:px-14">
        <section className="pb-7 pt-8 sm:pt-11">
          <h1 className="font-display text-4xl font-semibold leading-none tracking-tight sm:text-5xl">
            A coleção
          </h1>
          <div className="mt-6">
            <CoinFilters values={values} facets={facets.data} onChange={onChange} />
          </div>
        </section>

        {list.isSuccess && (
          <p className="mb-4 text-sm text-muted-foreground" aria-live="polite">
            {total} {total === 1 ? "moeda" : "moedas"}
          </p>
        )}

        {list.isPending && (
          <div
            className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
            aria-busy="true"
          >
            {Array.from({ length: 8 }, (_, i) => (
              <Skeleton key={i} className="h-[300px] rounded-2xl" />
            ))}
          </div>
        )}

        {list.isError && (
          <div role="alert" className="rounded-2xl bg-card p-8 text-center shadow-elegant">
            <p className="text-muted-foreground">
              Não foi possível carregar as moedas. Tente novamente em instantes.
            </p>
            <Button className="mt-4 h-11 rounded-full" onClick={() => list.refetch()}>
              Tentar novamente
            </Button>
          </div>
        )}

        {list.isSuccess && coins.length === 0 && (
          <div className="py-20 text-center">
            <Coins className="mx-auto h-16 w-16 text-muted-foreground/30" aria-hidden="true" />
            <h2 className="mt-4 font-display text-xl font-semibold">Nenhuma moeda encontrada</h2>
            <p className="mt-2 text-muted-foreground">Tente ajustar os filtros de busca.</p>
            <Button variant="outline" className="mt-6 h-11 rounded-full" onClick={clearFilters}>
              Limpar filtros
            </Button>
          </div>
        )}

        {list.isSuccess && coins.length > 0 && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {coins.map((coin) => (
              <CoinCard key={coin.id} coin={coin} />
            ))}
          </div>
        )}

        {list.isSuccess && totalPages > 1 && (
          <nav aria-label="Paginação" className="mt-10 flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-11 w-11 rounded-full"
              aria-label="Página anterior"
              onClick={() => setPage(page - 1)}
              disabled={page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-4 text-sm text-muted-foreground">
              Página {page} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-11 w-11 rounded-full"
              aria-label="Próxima página"
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </nav>
        )}
      </main>

      <PublicFooter />
    </div>
  )
}

export default Index
