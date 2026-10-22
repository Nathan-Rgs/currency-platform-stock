import { describe, expect, it } from "vitest"
import { groupByDecade, topN } from "./dashboard-data"

describe("topN", () => {
  it("keeps all rows when within limit", () => {
    const rows = [{ label: "BR", count: 2 }, { label: "US", count: 5 }]
    expect(topN(rows, 10)).toEqual([{ label: "US", count: 5 }, { label: "BR", count: 2 }])
  })
  it("aggregates the rest as Outros", () => {
    const rows = Array.from({ length: 12 }, (_, i) => ({ label: `P${i}`, count: 12 - i }))
    const out = topN(rows, 10)
    expect(out).toHaveLength(11)
    expect(out[0]).toEqual({ label: "P0", count: 12 })
    expect(out[10]).toEqual({ label: "Outros", count: 2 + 1 })
  })
})

describe("groupByDecade", () => {
  it("groups years into sorted decades", () => {
    expect(
      groupByDecade([{ year: 2002, count: 1 }, { year: 1994, count: 2 }, { year: 1998, count: 1 }]),
    ).toEqual([
      { label: "1990–1999", count: 3 },
      { label: "2000–2009", count: 1 },
    ])
  })
  it("returns empty for no data", () => {
    expect(groupByDecade([])).toEqual([])
  })
})
