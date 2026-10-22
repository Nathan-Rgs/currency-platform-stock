import { CoinFilters, FilterValues } from "@/components/coins/CoinFilters"
import { ImportDialog } from "@/components/coins/ImportDialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { Coin, CoinListParams, coinsApi, publicApi } from "@/lib/api"
import {
  formatBRL,
  originalityBadgeClasses,
  originalityLabel,
  resolveImageUrl,
} from "@/lib/coin-format"
import { downloadBlob, requestErrorDetail } from "@/lib/download"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import {
  ChevronLeft,
  ChevronRight,
  Coins,
  Copy,
  ExternalLink,
  FileDown,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Upload,
} from "lucide-react"
import { useCallback, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"

const PAGE_SIZE = 20

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

const actionClass =
  "inline-flex h-11 w-11 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"

function Thumb({ coin }: { coin: Coin }) {
  const src = resolveImageUrl(coin.image_url_front)
  return (
    <div className="coin-stage flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full">
      {src ? (
        <img src={src} alt={coin.title} loading="lazy" className="h-full w-full object-contain" />
      ) : (
        <Coins className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
      )}
    </div>
  )
}

function RowActions({ coin, onDelete }: { coin: Coin; onDelete: (c: Coin) => void }) {
  return (
    <div className="flex items-center justify-end">
      <a
        href={`/coins/${coin.id}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Ver na galeria: ${coin.title}`}
        className={actionClass}
      >
        <ExternalLink className="h-4 w-4" aria-hidden="true" />
      </a>
      <Link to={`/admin/coins/edit/${coin.id}`} aria-label={`Editar: ${coin.title}`} className={actionClass}>
        <Pencil className="h-4 w-4" aria-hidden="true" />
      </Link>
      <Link to={`/admin/coins/new?from=${coin.id}`} aria-label={`Duplicar: ${coin.title}`} className={actionClass}>
        <Copy className="h-4 w-4" aria-hidden="true" />
      </Link>
      <button
        type="button"
        aria-label={`Excluir: ${coin.title}`}
        onClick={() => onDelete(coin)}
        className={`${actionClass} text-destructive`}
      >
        <Trash2 className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  )
}

export default function CoinsList() {
  const [params, setParams] = useSearchParams()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [importOpen, setImportOpen] = useState(false)
  const [toDelete, setToDelete] = useState<Coin | null>(null)
  const [exporting, setExporting] = useState<"csv" | "json" | null>(null)

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
  const hasFilters = Object.entries(apiParams).some(
    ([k, v]) => k !== "page" && k !== "page_size" && k !== "sort" && v !== undefined,
  )

  const facets = useQuery({
    queryKey: ["public-facets"],
    queryFn: publicApi.facets,
    staleTime: 5 * 60_000,
  })
  const list = useQuery({
    queryKey: ["admin-coins", apiParams],
    queryFn: () => coinsApi.list(apiParams),
  })

  const coins = list.data?.data ?? []
  const total = list.data?.meta.total_items ?? 0
  const totalPages = list.data?.meta.total_pages ?? 1

  const handleDelete = async () => {
    if (!toDelete) return
    const wasLast = coins.length === 1 && page > 1
    try {
      await coinsApi.delete(toDelete.id)
      toast({ title: "Moeda excluída" })
      if (wasLast) setPage(page - 1)
      await queryClient.invalidateQueries({ queryKey: ["admin-coins"] })
    } catch (e) {
      toast({
        title: "Não foi possível excluir a moeda",
        description: await requestErrorDetail(e),
        variant: "destructive",
      })
    } finally {
      setToDelete(null)
    }
  }

  const exportAs = async (format: "csv" | "json") => {
    setExporting(format)
    try {
      const date = new Date().toISOString().slice(0, 10)
      downloadBlob(await coinsApi.exportFile(format), `colecao-${date}.${format}`)
    } catch (e) {
      toast({
        title: "Não foi possível exportar",
        description: await requestErrorDetail(e),
        variant: "destructive",
      })
    } finally {
      setExporting(null)
    }
  }

  const noCoinsAtAll = list.isSuccess && coins.length === 0 && !hasFilters

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground sm:text-3xl">Moedas</h1>
          {list.isSuccess && (
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {total} {total === 1 ? "moeda" : "moedas"}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="h-11 rounded-full" onClick={() => setImportOpen(true)}>
            <Upload className="mr-2 h-4 w-4" aria-hidden="true" />
            Importar
          </Button>
          {(["csv", "json"] as const).map((f) => (
            <Button
              key={f}
              variant="outline"
              className="h-11 rounded-full"
              disabled={exporting !== null}
              onClick={() => exportAs(f)}
            >
              {exporting === f ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <FileDown className="mr-2 h-4 w-4" aria-hidden="true" />
              )}
              Exportar {f.toUpperCase()}
            </Button>
          ))}
          <Button asChild className="h-11 rounded-full">
            <Link to="/admin/coins/new">
              <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
              Nova moeda
            </Link>
          </Button>
        </div>
      </header>

      {!noCoinsAtAll && <CoinFilters values={values} facets={facets.data} onChange={onChange} />}

      {list.isPending && (
        <div className="space-y-2" aria-busy="true">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-16 rounded-2xl" />
          ))}
        </div>
      )}

      {list.isError && (
        <div role="alert" className="rounded-2xl bg-card p-8 text-center shadow-elegant">
          <p className="text-muted-foreground">Não foi possível carregar as moedas.</p>
          <Button className="mt-4 h-11 rounded-full" onClick={() => list.refetch()}>
            Tentar novamente
          </Button>
        </div>
      )}

      {noCoinsAtAll && (
        <div className="rounded-2xl bg-card py-16 text-center shadow-elegant">
          <Coins className="mx-auto h-14 w-14 text-muted-foreground/30" aria-hidden="true" />
          <h2 className="mt-4 font-display text-xl font-semibold">Nenhuma moeda cadastrada</h2>
          <div className="mt-6 flex flex-col items-center justify-center gap-2 sm:flex-row">
            <Button asChild className="h-11 rounded-full">
              <Link to="/admin/coins/new">Cadastrar primeira moeda</Link>
            </Button>
            <Button variant="outline" className="h-11 rounded-full" onClick={() => setImportOpen(true)}>
              Importar planilha
            </Button>
          </div>
        </div>
      )}

      {list.isSuccess && coins.length === 0 && hasFilters && (
        <div className="rounded-2xl bg-card py-16 text-center shadow-elegant">
          <h2 className="font-display text-xl font-semibold">Nenhuma moeda encontrada</h2>
          <p className="mt-2 text-muted-foreground">Tente ajustar os filtros de busca.</p>
          <Button variant="outline" className="mt-6 h-11 rounded-full" onClick={clearFilters}>
            Limpar filtros
          </Button>
        </div>
      )}

      {list.isSuccess && coins.length > 0 && (
        <>
          <div className="hidden rounded-2xl bg-card shadow-elegant md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16"><span className="sr-only">Miniatura</span></TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Catálogo</TableHead>
                  <TableHead>País</TableHead>
                  <TableHead>Ano</TableHead>
                  <TableHead>Valor de face</TableHead>
                  <TableHead>Qtd.</TableHead>
                  <TableHead>Originalidade</TableHead>
                  <TableHead>À venda</TableHead>
                  <TableHead><span className="sr-only">Ações</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coins.map((coin) => (
                  <TableRow key={coin.id}>
                    <TableCell><Thumb coin={coin} /></TableCell>
                    <TableCell className="max-w-[16rem] truncate font-medium">{coin.title}</TableCell>
                    <TableCell>{coin.catalog_ref || "—"}</TableCell>
                    <TableCell>{coin.country}</TableCell>
                    <TableCell>{coin.year}</TableCell>
                    <TableCell>{coin.face_value}</TableCell>
                    <TableCell>{coin.quantity}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${originalityBadgeClasses(coin.originality)}`}
                      >
                        {originalityLabel(coin.originality)}
                      </span>
                    </TableCell>
                    <TableCell>{coin.for_sale ? formatBRL(coin.sale_price) : "—"}</TableCell>
                    <TableCell><RowActions coin={coin} onDelete={setToDelete} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <ul className="space-y-2 md:hidden">
            {coins.map((coin) => (
              <li key={coin.id} className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-elegant">
                <Thumb coin={coin} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{coin.title}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {coin.country} · {coin.year}
                  </p>
                </div>
                <RowActions coin={coin} onDelete={setToDelete} />
              </li>
            ))}
          </ul>

          {totalPages > 1 && (
            <nav aria-label="Paginação" className="flex items-center justify-center gap-3 pt-2">
              <Button
                variant="outline"
                className="h-11 rounded-full"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                <ChevronLeft className="mr-1 h-4 w-4" aria-hidden="true" />
                Anterior
              </Button>
              <span className="text-sm text-muted-foreground">
                Página {page} de {totalPages}
              </span>
              <Button
                variant="outline"
                className="h-11 rounded-full"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                Próxima
                <ChevronRight className="ml-1 h-4 w-4" aria-hidden="true" />
              </Button>
            </nav>
          )}
        </>
      )}

      <ImportDialog open={importOpen} onOpenChange={setImportOpen} />

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir moeda?</AlertDialogTitle>
            <AlertDialogDescription>
              {toDelete?.title} será removida permanentemente. Essa ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-11">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="h-11 bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
