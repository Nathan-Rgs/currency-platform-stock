import { API_URL } from "@/lib/api"

export type Originality = "original" | "replica" | "unknown"

export const ORIGINALITY_OPTIONS: { value: Originality; label: string }[] = [
  { value: "original", label: "Original" },
  { value: "replica", label: "Réplica" },
  { value: "unknown", label: "Desconhecida" },
]

export const CONDITION_OPTIONS: string[] = [
  "FC (Flor de Cunho)",
  "SOB (Soberba)",
  "MBC (Muito Bem Conservada)",
  "BC (Bem Conservada)",
  "R (Regular)",
  "UTG (Um Tanto Gasta)",
]

export function normalizeOriginality(v: unknown): Originality {
  const s = String(v ?? "").toLowerCase()
  return s === "original" || s === "replica" ? s : "unknown"
}

export function originalityLabel(v: string | null | undefined): string {
  const s = String(v ?? "").toLowerCase()
  return ORIGINALITY_OPTIONS.find((o) => o.value === s)?.label ?? (v || "—")
}

export function originalityBadgeClasses(v: string | null | undefined): string {
  const s = String(v ?? "").toLowerCase()
  if (s === "original") return "bg-emerald-500/10 text-emerald-700"
  if (s === "replica") return "bg-orange-500/10 text-orange-700"
  return "bg-muted text-muted-foreground"
}

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })

export function formatBRL(v: number | null | undefined): string {
  if (v == null) return "—"
  // Intl usa espaço não separável após "R$"
  return brl.format(Number(v)).replace(/ /g, " ")
}

export function resolveImageUrl(path: string | null | undefined): string | null {
  if (!path) return null
  const p = String(path).trim()
  if (!p || p === "string") return null
  if (p.startsWith("http://") || p.startsWith("https://")) return p
  return `${String(API_URL).replace(/\/$/, "")}/${p.replace(/^\//, "")}`
}
