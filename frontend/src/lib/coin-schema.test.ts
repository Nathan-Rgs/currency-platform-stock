import { expect, it } from "vitest"
import type { Coin } from "./api"
import { coinFormSchema, coinToFormValues, emptyCoinFormValues, toCoinPayload } from "./coin-schema"

const base = { title: "1 Real", country: "Brasil", year: "1994", face_value: "1 Real", quantity: "1",
  originality: "original", for_sale: false }

it("aceita vírgula decimal", () => {
  const v = coinFormSchema.parse({ ...base, purchase_price: "10,50", weight_g: "4,27" })
  expect([v.purchase_price, v.weight_g]).toEqual([10.5, 4.27])
})
it("vazio vira null no payload", () =>
  expect(toCoinPayload(coinFormSchema.parse({ ...base, category: "", purchase_price: "" })))
    .toMatchObject({ category: null, purchase_price: null }))
it("ano futuro é inválido", () =>
  expect(coinFormSchema.safeParse({ ...base, year: String(new Date().getFullYear() + 2) }).success).toBe(false))
it("à venda exige preço", () =>
  expect(coinFormSchema.safeParse({ ...base, for_sale: true, sale_price: "" }).success).toBe(false))
it("quantidade zero é inválida", () =>
  expect(coinFormSchema.safeParse({ ...base, quantity: "0" }).success).toBe(false))

it("obrigatórios rejeitam só espaços e número inválido", () => {
  expect(coinFormSchema.safeParse({ ...base, title: "   " }).success).toBe(false)
  expect(coinFormSchema.safeParse({ ...base, purchase_price: "abc" }).success).toBe(false)
  expect(coinFormSchema.safeParse({ ...base, purchase_price: "-1" }).success).toBe(false)
})

it("valores vazios do form são válidos exceto obrigatórios", () =>
  expect(coinFormSchema.safeParse({ ...emptyCoinFormValues, ...base }).success).toBe(true))

it("payload: trim, data YYYY-MM-DD e números", () => {
  const p = toCoinPayload(coinFormSchema.parse({ ...emptyCoinFormValues, ...base, title: " 1 Real ",
    acquisition_date: "2024-05-03", for_sale: true, sale_price: "90,00" }))
  expect(p).toMatchObject({ title: "1 Real", year: 1994, quantity: 1, acquisition_date: "2024-05-03",
    sale_price: 90, for_sale: true, notes: null })
})

it("coinToFormValues converte a moeda em strings do form", () => {
  const coin = {
    id: 1, owner_id: 1, created_at: "", updated_at: "", title: "5 Francos", quantity: 2, year: 1960,
    country: "França", face_value: "5 Francs", purchase_price: 65, originality: "ORIGINAL",
    acquisition_date: "2024-05-03T00:00:00", weight_g: 4.27, condition: "MBC (Muito Bem Conservada)",
    for_sale: true, sale_price: 90, catalog_ref: null,
  } as Coin
  const v = coinToFormValues(coin)
  expect(v).toMatchObject({ title: "5 Francos", quantity: "2", year: "1960", purchase_price: "65",
    weight_g: "4,27", originality: "original", acquisition_date: "2024-05-03", catalog_ref: "",
    estimated_value: "", for_sale: true, sale_price: "90" })
  expect(coinFormSchema.parse(v).weight_g).toBe(4.27)
})

it("rejeita milhar pt-BR ambíguo", () => {
  for (const v of ["1.234", "1.500"]) {
    const r = coinFormSchema.safeParse({ ...base, purchase_price: v })
    expect(r.success).toBe(false)
    expect(r.error?.issues[0].message).toBe("Use vírgula para decimais (ex.: 1500 ou 1500,00)")
  }
})
it("mantém ponto decimal curto", () =>
  expect(coinFormSchema.parse({ ...base, purchase_price: "10.50" }).purchase_price).toBe(10.5))
