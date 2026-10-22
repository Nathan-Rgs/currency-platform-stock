import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { CoinAuditLog } from "@/lib/api"
import { AUDIT_ACTIONS, auditActionLabel } from "@/lib/audit-action"
import {
  fieldLabel,
  formatValue,
  getChanges,
  type JsonObject,
} from "@/lib/audit-log-diff"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

type Props = {
  log: CoinAuditLog
}

export function AuditLogDetailsDialog({ log }: Props) {
  const changes = getChanges(
    log.before as JsonObject | null,
    log.after as JsonObject | null,
  )

  const coinTitle = log.coin
    ? `${log.coin.country} • ${log.coin.year} • ${log.coin.face_value}`
    : log.coin_id
    ? `ID da moeda: ${log.coin_id}`
    : "—"

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="h-11 rounded-full">
          Ver
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-3xl rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-display font-semibold">
            Registro de auditoria
          </DialogTitle>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span
              className={cn(
                "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
                AUDIT_ACTIONS[log.action]?.className ?? "bg-muted text-foreground",
              )}
            >
              {auditActionLabel(log.action)}
            </span>
            <span>{format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss")}</span>
          </div>
        </DialogHeader>

        <div className="max-h-[72vh] space-y-4 overflow-y-auto pr-1">
          {/* Resumo */}
          <div className="rounded-2xl bg-muted/40 p-4">
            <div className="text-sm font-medium">Moeda</div>
            <div className="text-sm text-muted-foreground">{coinTitle}</div>

            <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="font-medium">Autor:</span>{" "}
                <span className="text-muted-foreground">
                  {log.actor_email ?? "—"}
                </span>
              </div>
              <div>
                <span className="font-medium">Variação:</span>{" "}
                <span className="text-muted-foreground">
                  {log.delta_quantity ?? "—"}
                </span>
              </div>
              {log.note ? (
                <div className="col-span-2">
                  <span className="font-medium">Nota:</span>{" "}
                  <span className="text-muted-foreground">{log.note}</span>
                </div>
              ) : null}
            </div>
          </div>

          {/* Alterações */}
          <div>
            <div className="mb-2 font-semibold">Alterações</div>

            {changes.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                Nenhuma alteração de campo encontrada.
              </div>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-2 px-1 text-xs text-muted-foreground">
                  <div>Campo</div>
                  <div>Antes</div>
                  <div>Depois</div>
                </div>

                {changes.map((c) => {
                  const beforeText = formatValue(c.before)
                  const afterText = formatValue(c.after)

                  const isMultiline =
                    beforeText.includes("\n") || afterText.includes("\n")
                  const valueClass = isMultiline
                    ? "whitespace-pre-wrap font-mono text-xs"
                    : ""

                  return (
                    <div
                      key={c.field}
                      className="grid grid-cols-3 gap-2 rounded-xl bg-muted/40 p-2 text-sm"
                    >
                      <div className="break-words font-medium">
                        {fieldLabel(c.field)}
                      </div>
                      <div className={cn("break-words text-red-800", valueClass)}>
                        {beforeText}
                      </div>
                      <div className={cn("break-words text-success", valueClass)}>
                        {afterText}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* JSON bruto */}
          <details className="text-sm">
            <summary className="cursor-pointer font-medium">
              JSON bruto (depuração)
            </summary>

            <div className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <div className="mb-1 text-xs text-muted-foreground">Antes</div>
                <pre className="overflow-x-auto whitespace-pre-wrap rounded-xl bg-muted p-2 text-xs">
                  {JSON.stringify(log.before, null, 2)}
                </pre>
              </div>

              <div>
                <div className="mb-1 text-xs text-muted-foreground">Depois</div>
                <pre className="overflow-x-auto whitespace-pre-wrap rounded-xl bg-muted p-2 text-xs">
                  {JSON.stringify(log.after, null, 2)}
                </pre>
              </div>
            </div>
          </details>
        </div>
      </DialogContent>
    </Dialog>
  )
}
