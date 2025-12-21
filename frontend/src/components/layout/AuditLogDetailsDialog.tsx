// src/components/audit-log-details-dialog.tsx

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { CoinAuditLog } from "@/lib/api"
import { fieldLabel, formatValue, getChanges } from "@/lib/audit-log-diff"
import { format } from "date-fns"

type Props = {
  log: CoinAuditLog
}

const actionLabel = (action: string) => {
  const map: Record<string, string> = {
    create: "CREATE",
    update: "UPDATE",
    delete: "DELETE",
    import: "IMPORT",
    adjust_in: "ADJUST IN",
    adjust_out: "ADJUST OUT",
  }
  return map[action] ?? action.toUpperCase()
}

export function AuditLogDetailsDialog({ log }: Props) {
  const changes = getChanges(
    (log.before ?? undefined) as any,
    (log.after ?? undefined) as any
  )

  const coinTitle = log.coin
    ? `${log.coin.country} • ${log.coin.year} • ${log.coin.face_value}`
    : log.coin_id
    ? `Coin ID: ${log.coin_id}`
    : "Coin: —"

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">View</Button>
      </DialogTrigger>

      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Audit Log</DialogTitle>
          <div className="text-sm text-muted-foreground">
            {actionLabel(log.action)} •{" "}
            {format(new Date(log.created_at), "yyyy-MM-dd HH:mm:ss")}
          </div>
        </DialogHeader>

        <div className="space-y-4 max-h-[72vh] overflow-y-auto pr-1">
          {/* Summary */}
          <div className="rounded-md border p-3 bg-muted/30">
            <div className="text-sm font-medium">Coin</div>
            <div className="text-sm text-muted-foreground">{coinTitle}</div>

            <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="font-medium">Actor:</span>{" "}
                <span className="text-muted-foreground">
                  {log.actor_email ?? "—"}
                </span>
              </div>
              <div>
                <span className="font-medium">Qty delta:</span>{" "}
                <span className="text-muted-foreground">
                  {log.delta_quantity ?? "—"}
                </span>
              </div>
              {log.note ? (
                <div className="col-span-2">
                  <span className="font-medium">Note:</span>{" "}
                  <span className="text-muted-foreground">{log.note}</span>
                </div>
              ) : null}
            </div>
          </div>

          {/* Changes */}
          <div>
            <div className="font-semibold mb-2">Changes</div>

            {changes.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                No field-level changes found.
              </div>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground px-1">
                  <div>Field</div>
                  <div>Before</div>
                  <div>After</div>
                </div>

                {changes.map((c) => {
                  const beforeText = formatValue(c.before as any)
                  const afterText = formatValue(c.after as any)

                  const isMultiline =
                    beforeText.includes("\n") || afterText.includes("\n")

                  return (
                    <div
                      key={c.field}
                      className="grid grid-cols-3 gap-2 rounded-md border p-2 text-sm"
                    >
                      <div className="font-medium break-words">
                        {fieldLabel(c.field)}
                      </div>

                      <div
                        className={`text-red-600 break-words ${
                          isMultiline
                            ? "whitespace-pre-wrap font-mono text-xs"
                            : ""
                        }`}
                      >
                        {beforeText}
                      </div>

                      <div
                        className={`text-green-600 break-words ${
                          isMultiline
                            ? "whitespace-pre-wrap font-mono text-xs"
                            : ""
                        }`}
                      >
                        {afterText}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Raw JSON */}
          <details className="text-sm">
            <summary className="cursor-pointer font-medium">
              Raw JSON (debug)
            </summary>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Before</div>
                <pre className="bg-muted p-2 rounded-md overflow-x-auto text-xs whitespace-pre-wrap">
                  {JSON.stringify(log.before, null, 2)}
                </pre>
              </div>

              <div>
                <div className="text-xs text-muted-foreground mb-1">After</div>
                <pre className="bg-muted p-2 rounded-md overflow-x-auto text-xs whitespace-pre-wrap">
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
