import { z } from "zod"
import type { Coin, CoinCreate } from "./api"
import { normalizeOriginality } from "./coin-format"

// Form inputs are strings (text inputs); the schema trims, coerces and maps "" to null.

const required = (max: number) =>
  z.string().trim().min(1, "Campo obrigatório.").max(max, `Máximo de ${max} caracteres.`)

const optionalText = (max?: number) =>
  (max ? z.string().trim().max(max, `Máximo de ${max} caracteres.`) : z.string().trim())
    .optional()
    .transform((v) => v || null)

// Accepts "10,50" and "10.50"; "" -> null.
const optionalNumber = z
  .string()
  .optional()
  .transform((v, ctx) => {
    const raw = (v ?? "").trim()
    if (/^\d{1,3}(\.\d{3})+$/.test(raw)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Use vírgula para decimais (ex.: 1500 ou 1500,00)" })
      return z.NEVER
    }
    const s = raw.replace(",", ".")
    if (!s) return null
    const n = Number(s)
    if (!Number.isFinite(n) || n < 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Informe um número válido (ex.: 10,50)." })
      return z.NEVER
    }
    return n
  })

const integer = (message: string, valid: (n: number) => boolean) =>
  z
    .string()
    .trim()
    .regex(/^\d+$/, message)
    .transform(Number)
    .refine(valid, message)

export const coinFormSchema = z
  .object({
    title: required(100),
    country: required(100),
    year: integer(
      `Ano entre 1 e ${new Date().getFullYear() + 1}.`,
      (n) => n >= 1 && n <= new Date().getFullYear() + 1,
    ),
    face_value: required(100),
    catalog_ref: optionalText(50),
    quantity: integer("Quantidade mínima é 1.", (n) => n >= 1),
    material: optionalText(100),
    diameter_mm: optionalNumber,
    weight_g: optionalNumber,
    mint_mark: optionalText(50),
    condition: optionalText(100),
    originality: z.enum(["original", "replica", "unknown"]),
    category: optionalText(100),
    purchase_price: optionalNumber,
    estimated_value: optionalNumber,
    acquisition_source: optionalText(200),
    acquisition_date: optionalText(),
    storage_location: optionalText(200),
    notes: optionalText(),
    for_sale: z.boolean(),
    sale_price: optionalNumber,
    public_description: optionalText(),
  })
  .superRefine((v, ctx) => {
    if (v.for_sale && v.sale_price == null) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["sale_price"], message: "Informe o preço de venda." })
    }
  })

/** Raw form state (strings). */
export type CoinFormValues = z.input<typeof coinFormSchema>
/** Validated/coerced values. */
export type CoinFormParsed = z.output<typeof coinFormSchema>

export const emptyCoinFormValues: Required<CoinFormValues> = {
  title: "",
  country: "",
  year: "",
  face_value: "",
  catalog_ref: "",
  quantity: "1",
  material: "",
  diameter_mm: "",
  weight_g: "",
  mint_mark: "",
  condition: "",
  originality: "unknown",
  category: "",
  purchase_price: "",
  estimated_value: "",
  acquisition_source: "",
  acquisition_date: "",
  storage_location: "",
  notes: "",
  for_sale: false,
  sale_price: "",
  public_description: "",
}

export function toCoinPayload(values: CoinFormParsed): CoinCreate {
  // acquisition_date stays "YYYY-MM-DD" (backend parses it).
  return { ...values } as CoinCreate
}

const str = (v: string | null | undefined) => v ?? ""
const num = (v: number | null | undefined) => (v == null ? "" : String(v).replace(".", ","))

export function coinToFormValues(coin: Coin): Required<CoinFormValues> {
  return {
    title: str(coin.title),
    country: str(coin.country),
    year: coin.year == null ? "" : String(coin.year),
    face_value: str(coin.face_value),
    catalog_ref: str(coin.catalog_ref),
    quantity: String(coin.quantity ?? 1),
    material: str(coin.material),
    diameter_mm: num(coin.diameter_mm),
    weight_g: num(coin.weight_g),
    mint_mark: str(coin.mint_mark),
    condition: str(coin.condition),
    originality: normalizeOriginality(coin.originality),
    category: str(coin.category),
    purchase_price: num(coin.purchase_price),
    estimated_value: num(coin.estimated_value),
    acquisition_source: str(coin.acquisition_source),
    acquisition_date: str(coin.acquisition_date).slice(0, 10),
    storage_location: str(coin.storage_location),
    notes: str(coin.notes),
    for_sale: !!coin.for_sale,
    sale_price: num(coin.sale_price),
    public_description: str(coin.public_description),
  }
}
