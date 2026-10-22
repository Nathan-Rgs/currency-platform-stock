import { AuditLogDetailsDialog } from "@/components/layout/AuditLogDetailsDialog"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
import { Input } from "@/components/ui/input"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { adminApi, apiErrorMessage, CoinAuditLog } from "@/lib/api"
import { AUDIT_ACTIONS, auditActionLabel } from "@/lib/audit-action"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"

const ACTION_FILTERS: [string, string][] = [
  ["", "Todas"],
  ...Object.entries(AUDIT_ACTIONS).map(([k, v]): [string, string] => [k, v.label]),
]

const AuditLogsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [logs, setLogs] = useState<CoinAuditLog[]>([])
  const [totalPages, setTotalPages] = useState(1)
  const { toast } = useToast()

  const page = Number(searchParams.get("page")) || 1
  const action = searchParams.get("action") || ""
  const dateFrom = searchParams.get("date_from") || ""
  const dateTo = searchParams.get("date_to") || ""
  const search = searchParams.get("search") || ""

  useEffect(() => {
    const fetchLogs = async () => {
      const params = {
        page,
        action: action || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        actor_email: search || undefined,
      }
      try {
        const response = await adminApi.listAuditLogs(params)
        setLogs(response.data ?? [])
        setTotalPages(response.meta?.total_pages ?? 1)
      } catch (e) {
        toast({
          title: "Não foi possível carregar os logs",
          description: apiErrorMessage(e, "Tente novamente."),
          variant: "destructive",
        })
      }
    }
    fetchLogs()
  }, [page, action, dateFrom, dateTo, search, toast])

  const handleFilterChange = (key: string, value: string) => {
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev)
      if (value) newParams.set(key, value)
      else newParams.delete(key)
      if (key !== "page") newParams.set("page", "1")
      return newParams
    })
  }

  return (
    <div className="p-4 md:p-8">
      <h1 className="mb-4 font-display text-2xl font-semibold text-foreground">
        Logs de auditoria
      </h1>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div
          role="group"
          aria-label="Filtrar por ação"
          className="flex flex-wrap gap-2"
        >
          {ACTION_FILTERS.map(([value, label]) => (
            <button
              key={value || "all"}
              type="button"
              aria-pressed={action === value}
              onClick={() => handleFilterChange("action", value)}
              className={cn(
                "min-h-[44px] rounded-full px-4 text-sm font-medium transition-colors",
                action === value
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-foreground shadow-elegant hover:bg-muted",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <DatePicker
          date={dateFrom ? new Date(dateFrom) : undefined}
          onDateChange={(d) =>
            handleFilterChange("date_from", d?.toISOString() || "")
          }
          placeholder="Data inicial"
        />
        <DatePicker
          date={dateTo ? new Date(dateTo) : undefined}
          onDateChange={(d) =>
            handleFilterChange("date_to", d?.toISOString() || "")
          }
          placeholder="Data final"
        />

        <Input
          className="h-11 min-w-[240px] flex-1 rounded-full bg-card md:max-w-xs"
          aria-label="Buscar por e-mail do autor"
          placeholder="Buscar por e-mail do autor"
          value={search}
          onChange={(e) => handleFilterChange("search", e.target.value)}
        />

        {(action || dateFrom || dateTo || search) && (
          <Button
            variant="secondary"
            className="h-11 rounded-full"
            onClick={() => {
              setSearchParams(new URLSearchParams({ page: "1" }))
            }}
          >
            Limpar
          </Button>
        )}
      </div>

      <div className="overflow-x-auto rounded-2xl bg-card p-2 shadow-elegant">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Ação</TableHead>
              <TableHead>Moeda</TableHead>
              <TableHead>Variação</TableHead>
              <TableHead>Autor</TableHead>
              <TableHead>Nota</TableHead>
              <TableHead>Detalhes</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="whitespace-nowrap">
                  {format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss")}
                </TableCell>
                <TableCell>
                  <span
                    className={cn(
                      "inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold",
                      AUDIT_ACTIONS[log.action]?.className ??
                        "bg-muted text-foreground",
                    )}
                  >
                    {auditActionLabel(log.action)}
                  </span>
                </TableCell>
                <TableCell>
                  {log.coin
                    ? `${log.coin.country} ${log.coin.year} ${log.coin.face_value}`
                    : log.coin_id
                    ? `ID ${log.coin_id}`
                    : "—"}
                </TableCell>
                <TableCell>{log.delta_quantity ?? "—"}</TableCell>
                <TableCell>{log.actor_email ?? "—"}</TableCell>
                <TableCell className="max-w-[240px] truncate">
                  {log.note ?? "—"}
                </TableCell>
                <TableCell>
                  <AuditLogDetailsDialog log={log} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Pagination className="mt-4">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="#"
              onClick={(e) => {
                e.preventDefault()
                if (page > 1) handleFilterChange("page", String(page - 1))
              }}
            />
          </PaginationItem>

          {Array.from({ length: totalPages }, (_, i) => (
            <PaginationItem key={i}>
              <PaginationLink
                href="#"
                isActive={i + 1 === page}
                onClick={(e) => {
                  e.preventDefault()
                  handleFilterChange("page", String(i + 1))
                }}
              >
                {i + 1}
              </PaginationLink>
            </PaginationItem>
          ))}

          <PaginationItem>
            <PaginationNext
              href="#"
              onClick={(e) => {
                e.preventDefault()
                if (page < totalPages)
                  handleFilterChange("page", String(page + 1))
              }}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}

export default AuditLogsPage
