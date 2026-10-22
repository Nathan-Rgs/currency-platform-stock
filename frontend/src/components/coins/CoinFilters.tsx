import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CoinFacets } from "@/lib/api"
import { ORIGINALITY_OPTIONS } from "@/lib/coin-format"
import { cn } from "@/lib/utils"
import { Search } from "lucide-react"
import { useEffect, useState } from "react"

export interface FilterValues {
  search: string
  country: string
  category: string
  yearFrom: string
  yearTo: string
  originality: string
  forSale: boolean
  sort: string
}

interface Props {
  values: FilterValues
  facets?: CoinFacets
  onChange: (patch: Partial<FilterValues>) => void
}

const ALL = "all"
const shadow = "shadow-[0_1px_2px_rgba(31,36,48,.06)]"
const trigger = `h-11 w-auto min-w-[8.5rem] rounded-full border-0 bg-card px-4 text-sm ${shadow}`

const SORT_OPTIONS = [
  { value: "created_desc", label: "Mais recentes" },
  { value: "year_asc", label: "Ano (crescente)" },
  { value: "year_desc", label: "Ano (decrescente)" },
  { value: "title_asc", label: "Título (A–Z)" },
]

function SimpleSelect({
  label,
  value,
  onChange,
  options,
  allLabel,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  allLabel?: string
}) {
  return (
    <Select
      value={value || ALL}
      onValueChange={(v) => onChange(v === ALL ? "" : v)}
    >
      <SelectTrigger aria-label={label} className={trigger}>
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        {allLabel && <SelectItem value={ALL}>{allLabel}</SelectItem>}
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export function CoinFilters({ values, facets, onChange }: Props) {
  // Busca e anos ficam locais; vão para a URL após debounce / "Aplicar".
  const [search, setSearch] = useState(values.search)
  const [yearFrom, setYearFrom] = useState(values.yearFrom)
  const [yearTo, setYearTo] = useState(values.yearTo)

  // Ressincroniza quando a URL muda por fora (limpar filtros, voltar).
  useEffect(() => setSearch(values.search), [values.search])
  useEffect(() => setYearFrom(values.yearFrom), [values.yearFrom])
  useEffect(() => setYearTo(values.yearTo), [values.yearTo])

  useEffect(() => {
    if (search === values.search) return
    const t = setTimeout(() => onChange({ search }), 400)
    return () => clearTimeout(t)
  }, [search, values.search, onChange])

  const toOpts = (l: string[] = []) => l.map((v) => ({ value: v, label: v }))
  const yearActive = !!(values.yearFrom || values.yearTo)
  const yearLabel = yearActive
    ? `Ano: ${values.yearFrom || "…"}–${values.yearTo || "…"}`
    : "Ano"

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label
        className={`flex h-11 w-full items-center gap-2 rounded-full bg-card px-4 text-muted-foreground sm:w-[280px] ${shadow}`}
      >
        <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
        <input
          type="search"
          aria-label="Buscar"
          placeholder="Buscar moeda"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />
      </label>

      <SimpleSelect
        label="País"
        allLabel="Todos os países"
        value={values.country}
        onChange={(country) => onChange({ country })}
        options={toOpts(facets?.countries)}
      />
      <SimpleSelect
        label="Categoria"
        allLabel="Todas as categorias"
        value={values.category}
        onChange={(category) => onChange({ category })}
        options={toOpts(facets?.categories)}
      />

      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              trigger,
              "inline-flex items-center justify-center",
              yearActive && "font-semibold",
            )}
          >
            {yearLabel}
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-64">
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault()
              onChange({ yearFrom, yearTo })
            }}
          >
            <div className="flex gap-2">
              <Input
                type="number"
                inputMode="numeric"
                aria-label="Ano de"
                className="h-11"
                placeholder={
                  facets?.year_min != null ? String(facets.year_min) : "De"
                }
                value={yearFrom}
                onChange={(e) => setYearFrom(e.target.value)}
              />
              <Input
                type="number"
                inputMode="numeric"
                aria-label="Ano até"
                className="h-11"
                placeholder={
                  facets?.year_max != null ? String(facets.year_max) : "Até"
                }
                value={yearTo}
                onChange={(e) => setYearTo(e.target.value)}
              />
            </div>
            <Button type="submit" className="h-11 w-full rounded-full">
              Aplicar
            </Button>
          </form>
        </PopoverContent>
      </Popover>

      <SimpleSelect
        label="Originalidade"
        allLabel="Todas"
        value={values.originality}
        onChange={(originality) => onChange({ originality })}
        options={ORIGINALITY_OPTIONS}
      />

      <button
        type="button"
        aria-pressed={values.forSale}
        onClick={() => onChange({ forSale: !values.forSale })}
        className={cn(
          `h-11 rounded-full px-4 text-sm transition-colors ${shadow}`,
          values.forSale
            ? "bg-accent font-semibold text-accent-foreground"
            : "bg-card text-foreground",
        )}
      >
        À venda
      </button>

      <SimpleSelect
        label="Ordenar"
        value={values.sort || "created_desc"}
        onChange={(sort) => onChange({ sort })}
        options={SORT_OPTIONS}
      />
    </div>
  )
}
