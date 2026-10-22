import { describe, expect, it } from "vitest"
import { formatBRL, originalityLabel, resolveImageUrl } from "./coin-format"

describe("coin-format", () => {
  it("formata BRL", () => expect(formatBRL(1234.5)).toBe("R$ 1.234,50"))
  it("nulo vira traço", () => expect(formatBRL(null)).toBe("—"))
  it("rótulo de originalidade", () => expect(originalityLabel("REPLICA")).toBe("Réplica"))
  it("caminho relativo vira absoluto", () =>
    expect(resolveImageUrl("media/coins/a.jpg")).toBe("http://localhost:8000/media/coins/a.jpg"))
  it("vazio ou 'string' vira null", () => {
    expect(resolveImageUrl("")).toBeNull()
    expect(resolveImageUrl("string")).toBeNull()
  })
})
