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
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { Coin, coinsApi, PaginatedResponse } from "@/lib/api"
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"

type Originality = "original" | "replica" | "unknown" | string

function formatCurrencyUSD(value: number) {
  return `$${(value ?? 0).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`
}

function originalityLabel(value: Originality) {
  const v = String(value ?? "").toLowerCase()
  if (v === "original") return "Original"
  if (v === "replica") return "Réplica"
  if (v === "unknown") return "Desconhecida"
  return value || "—"
}

function originalityBadgeClasses(value: Originality) {
  const v = String(value ?? "").toLowerCase()
  if (v === "original") return "bg-emerald-500/10 text-emerald-700"
  if (v === "replica") return "bg-orange-500/10 text-orange-700"
  return "bg-muted text-muted-foreground"
}

export default function CoinsList() {
  const [coins, setCoins] = useState<Coin[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 })
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const { toast } = useToast()

  const fetchCoins = async (page = 1) => {
    setLoading(true)
    try {
      const params: Record<string, any> = { page, page_size: 10 }
      if (search) params.search = search

      const response: PaginatedResponse<Coin> = await coinsApi.list(params)
      setCoins(response.items)
      setPagination({ page: response.page, totalPages: response.total_pages })
    } catch (err) {
      // Demo data alinhado ao seu payload do banco
      setCoins([
        {
          id: 1,
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
          created_at: "",
          updated_at: "",
        } as any,
      ])
      setPagination({ page: 1, totalPages: 1 })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCoins()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => fetchCoins(1), 500)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  const handleDelete = async () => {
    if (!deleteId) return

    try {
      await coinsApi.delete(deleteId)
      toast({ title: "Sucesso", description: "Moeda excluída com sucesso." })
      fetchCoins(pagination.page)
    } catch (err) {
      toast({
        title: "Erro",
        description: "Não foi possível excluir a moeda.",
        variant: "destructive",
      })
    } finally {
      setDeleteId(null)
    }
  }

  const hasItems = useMemo(() => coins.length > 0, [coins])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">
            Gerenciar Moedas
          </h1>
          <p className="mt-1 text-muted-foreground">
            Adicione, edite ou remova moedas da sua coleção
          </p>
        </div>
        <Link to="/admin/coins/new">
          <Button variant="gold" className="gap-2">
            <Plus className="h-4 w-4" />
            Adicionar Moeda
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar moedas..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-elegant">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-gold" />
          </div>
        ) : !hasItems ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16">
            <p className="font-medium text-foreground">
              Nenhuma moeda encontrada
            </p>
            <p className="text-sm text-muted-foreground">
              Tente ajustar a busca ou adicione uma nova moeda.
            </p>
            <Link to="/admin/coins/new" className="mt-2">
              <Button variant="gold" className="gap-2">
                <Plus className="h-4 w-4" />
                Adicionar Moeda
              </Button>
            </Link>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>País</TableHead>
                <TableHead>Ano</TableHead>
                <TableHead>Valor de Face</TableHead>
                <TableHead>Originalidade</TableHead>
                <TableHead>Valor Estimado</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {coins.map((coin: any) => (
                <TableRow key={coin.id}>
                  <TableCell className="font-medium">{coin.country}</TableCell>
                  <TableCell>{coin.year}</TableCell>

                  {/* Agora bate com seu banco: face_value é string (ex: "1 Real") */}
                  <TableCell>{coin.face_value ?? "—"}</TableCell>

                  {/* originality: original|replica|unknown */}
                  <TableCell>
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${originalityBadgeClasses(
                        coin.originality
                      )}`}
                    >
                      {originalityLabel(coin.originality)}
                    </span>
                  </TableCell>

                  <TableCell className="font-display font-semibold text-gold">
                    {formatCurrencyUSD(Number(coin.estimated_value ?? 0))}
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link to={`/admin/coins/edit/${coin.id}`}>
                        <Button variant="ghost" size="icon" aria-label="Editar">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </Link>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        aria-label="Excluir"
                        onClick={() => setDeleteId(coin.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Pagination */}
      {!loading && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
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

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir moeda?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A moeda será permanentemente
              removida da sua coleção.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
