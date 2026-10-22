import axios from "axios"

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

// ponytail: Task 17 replaces this with the shared apiErrorMessage helper.
// Handles blob responses (export/template) whose error body is JSON.
export async function requestErrorDetail(e: unknown): Promise<string> {
  if (axios.isAxiosError(e)) {
    let data = e.response?.data
    if (data instanceof Blob) {
      try {
        data = JSON.parse(await data.text())
      } catch {
        data = undefined
      }
    }
    const detail = data?.detail
    if (typeof detail === "string") return detail
    if (Array.isArray(detail)) {
      const msgs = detail.map((d) => d?.msg).filter(Boolean)
      if (msgs.length) return msgs.join("; ")
    }
  }
  return "Falha de conexão. Tente novamente."
}
