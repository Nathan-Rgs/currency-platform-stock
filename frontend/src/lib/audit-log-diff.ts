export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue }

export type JsonObject = Record<string, JsonValue>

export type FieldChange = {
  field: string
  before: JsonValue | undefined
  after: JsonValue | undefined
}

const stableStringify = (v: unknown) => {
  try {
    return JSON.stringify(v)
  } catch {
    return String(v)
  }
}

export const getChanges = (
  before?: JsonObject | null,
  after?: JsonObject | null
): FieldChange[] => {
  if (!before || !after) return []

  const keys = new Set<string>([
    ...Object.keys(before ?? {}),
    ...Object.keys(after ?? {}),
  ])

  const changes: FieldChange[] = []
  for (const key of keys) {
    const b = before[key]
    const a = after[key]
    if (stableStringify(b) !== stableStringify(a)) {
      changes.push({ field: key, before: b, after: a })
    }
  }

  return changes
}

export const formatValue = (v: JsonValue | undefined) => {
  if (v === undefined || v === null) return "—"
  if (typeof v === "string") return v === "" ? "—" : v
  if (typeof v === "number" || typeof v === "boolean") return String(v)

  // arrays/objects
  try {
    return JSON.stringify(v, null, 2)
  } catch {
    return String(v)
  }
}

export const fieldLabel = (field: string) => {
  const map: Record<string, string> = {
    quantity: "Quantidade",
    year: "Ano",
    country: "País",
    face_value: "Valor de face",
    purchase_price: "Preço de compra",
    estimated_value: "Valor estimado",
    originality: "Originalidade",
    condition: "Conservação",
    storage_location: "Local de guarda",
    category: "Categoria",
    acquisition_date: "Data de aquisição",
    acquisition_source: "Origem da aquisição",
    notes: "Observações",
    image_url_front: "Imagem (frente)",
    image_url_back: "Imagem (verso)",
    owner_id: "Proprietário",
    id: "ID da moeda",
    created_at: "Criado em",
    updated_at: "Atualizado em",
  }

  return map[field] ?? field
}
