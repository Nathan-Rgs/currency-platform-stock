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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { adminApi, CoinAuditLog } from "@/lib/api"
import { format } from "date-fns"
import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"

const AuditLogsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [logs, setLogs] = useState<CoinAuditLog[]>([])
  const [totalPages, setTotalPages] = useState(1)

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
      const response = await adminApi.listAuditLogs(params)
      setLogs(response.data ?? [])
      setTotalPages(response.meta?.total_pages ?? 1)
    }
    fetchLogs()
  }, [searchParams, page, action, dateFrom, dateTo, search])

  const handleFilterChange = (key: string, value: string) => {
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev)
      if (value) newParams.set(key, value)
      else newParams.delete(key)
      newParams.set("page", "1")
      return newParams
    })
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Audit Logs</h1>

      <div className="flex gap-2 mb-4 flex-wrap">
        <Select
          value={action}
          onValueChange={(v) =>
            handleFilterChange("action", v === "all" ? "" : v)
          }
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            <SelectItem value="create">Create</SelectItem>
            <SelectItem value="update">Update</SelectItem>
            <SelectItem value="delete">Delete</SelectItem>
            <SelectItem value="import">Import</SelectItem>
            <SelectItem value="adjust_in">Adjust In</SelectItem>
            <SelectItem value="adjust_out">Adjust Out</SelectItem>
          </SelectContent>
        </Select>

        <DatePicker
          date={dateFrom ? new Date(dateFrom) : undefined}
          onDateChange={(d) =>
            handleFilterChange("date_from", d?.toISOString() || "")
          }
          placeholder="Date from"
        />
        <DatePicker
          date={dateTo ? new Date(dateTo) : undefined}
          onDateChange={(d) =>
            handleFilterChange("date_to", d?.toISOString() || "")
          }
          placeholder="Date to"
        />

        <Input
          className="min-w-[240px]"
          placeholder="Search by actor email"
          value={search}
          onChange={(e) => handleFilterChange("search", e.target.value)}
        />

        {(action || dateFrom || dateTo || search) && (
          <Button
            variant="secondary"
            onClick={() => {
              setSearchParams(new URLSearchParams({ page: "1" }))
            }}
          >
            Clear
          </Button>
        )}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Coin</TableHead>
            <TableHead>Quantity Change</TableHead>
            <TableHead>Actor</TableHead>
            <TableHead>Note</TableHead>
            <TableHead>Details</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {logs.map((log) => (
            <TableRow key={log.id}>
              <TableCell>
                {format(new Date(log.created_at), "yyyy-MM-dd HH:mm:ss")}
              </TableCell>
              <TableCell>{log.action}</TableCell>
              <TableCell>
                {log.coin
                  ? `${log.coin.country} ${log.coin.year} ${log.coin.face_value}`
                  : log.coin_id
                  ? `ID: ${log.coin_id}`
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
