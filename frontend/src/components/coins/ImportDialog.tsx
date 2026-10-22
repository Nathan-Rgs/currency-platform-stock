import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { coinsApi, ImportResult } from "@/lib/api"
import { downloadBlob, requestErrorDetail } from "@/lib/download"
import { useQueryClient } from "@tanstack/react-query"
import { Download, Loader2 } from "lucide-react"
import { useState } from "react"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ImportDialog({ open, onOpenChange }: Props) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setFile(null)
      setResult(null)
      setBusy(false)
    }
    onOpenChange(next)
  }

  const fail = async (title: string, e: unknown) =>
    toast({ title, description: await requestErrorDetail(e), variant: "destructive" })

  const downloadTemplate = async () => {
    try {
      downloadBlob(await coinsApi.template(), "modelo-importacao.csv")
    } catch (e) {
      await fail("Não foi possível baixar o modelo", e)
    }
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || busy) return
    setBusy(true)
    try {
      setResult(await coinsApi.importFile(file))
      queryClient.invalidateQueries({ queryKey: ["admin-coins"] })
    } catch (err) {
      await fail("Não foi possível importar", err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-display font-semibold">Importar planilha</DialogTitle>
          <DialogDescription>
            Envie um arquivo CSV ou JSON com as moedas. Linhas com erro são ignoradas.
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="space-y-3">
            <p className="font-semibold" role="status">
              {result.inserted} {result.inserted === 1 ? "moeda importada" : "moedas importadas"}
            </p>
            {result.errors.length > 0 && (
              <div className="max-h-60 overflow-auto rounded-xl bg-muted/50">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-20">Linha</TableHead>
                      <TableHead>Erro</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.errors.map((er, i) => (
                      <TableRow key={`${er.row}-${i}`}>
                        <TableCell>{er.row}</TableCell>
                        <TableCell>{er.message}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            <Button className="h-11 w-full rounded-full" onClick={() => handleOpenChange(false)}>
              Fechar
            </Button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="import-file">Arquivo (.csv ou .json)</Label>
              <Input
                id="import-file"
                type="file"
                accept=".csv,.json"
                className="h-11 cursor-pointer file:mr-3 file:font-medium"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
              <Button
                type="button"
                variant="outline"
                className="h-11 rounded-full"
                onClick={downloadTemplate}
              >
                <Download className="mr-2 h-4 w-4" aria-hidden="true" />
                Baixar modelo
              </Button>
              <Button type="submit" disabled={!file || busy} className="h-11 rounded-full">
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
                Importar
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
