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
    const b = (before as any)?.[key]
    const a = (after as any)?.[key]
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
    quantity: "Quantity",
    year: "Year",
    country: "Country",
    face_value: "Face value",
    purchase_price: "Purchase price",
    estimated_value: "Estimated value",
    originality: "Originality",
    condition: "Condition",
    storage_location: "Storage location",
    category: "Category",
    acquisition_date: "Acquisition date",
    acquisition_source: "Acquisition source",
    notes: "Notes",
    image_url_front: "Front image",
    image_url_back: "Back image",
    owner_id: "Owner",
    id: "Coin ID",
    created_at: "Created at",
    updated_at: "Updated at",
  }

  return map[field] ?? field
}
