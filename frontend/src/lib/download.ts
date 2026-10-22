import axios from "axios"
import { apiErrorMessage } from "@/lib/api"

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

// Blob responses (export/template) carry JSON error bodies: parse them, then
// delegate to the shared formatter.
export async function requestErrorDetail(e: unknown): Promise<string> {
  if (axios.isAxiosError(e) && e.response?.data instanceof Blob) {
    try {
      e.response.data = JSON.parse(await e.response.data.text())
    } catch {
      e.response.data = undefined
    }
  }
  return apiErrorMessage(e, "Não foi possível concluir a operação.")
}
