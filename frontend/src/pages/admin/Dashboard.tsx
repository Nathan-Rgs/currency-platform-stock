import { ImportDialog } from "@/components/coins/ImportDialog"
import { Button } from "@/components/ui/button"
import { ChartContainer } from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"
import { dashboardApi } from "@/lib/api"
import { formatBRL, originalityLabel, resolveImageUrl } from "@/lib/coin-format"
import { ChartRow, groupByDecade, topN } from "@/lib/dashboard-data"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { Link } from "react-router-dom"
import { Bar, BarChart, Cell, LabelList, XAxis, YAxis } from "recharts"

// Graphite, gold and graphite tints: lightness differs, not only hue.
const PALETTE = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(var(--primary) / 0.6)",
  "hsl(var(--accent) / 0.55)",
  "hsl(var(--primary) / 0.35)",
]

const card = "rounded-2xl bg-card p-5 shadow-elegant"

function Kpi({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className={card}>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-3xl font-semibold tabular-nums">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  )
}

function BarCard({ title, rows, colorful }: { title: string; rows: ChartRow[]; colorful?: boolean }) {
  if (!rows.length) return null
  const height = Math.max(120, rows.length * 36 + 16)
  return (
    <section className={card} aria-label={title}>
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      <ChartContainer config={{}} className="mt-3 aspect-auto w-full" style={{ height }} aria-hidden="true">
        <BarChart data={rows} layout="vertical" margin={{ left: 0, right: 28 }}>
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="label"
            width={96}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
          />
          <Bar dataKey="count" radius={6} barSize={20}>
            {rows.map((r, i) => (
              <Cell key={r.label} fill={colorful ? PALETTE[i % PALETTE.length] : PALETTE[0]} />
            ))}
            <LabelList dataKey="count" position="right" fill="hsl(var(--muted-foreground))" fontSize={12} />
          </Bar>
        </BarChart>
      </ChartContainer>
      <ul className="sr-only">
        {rows.map((r) => (
          <li key={r.label}>
            {r.label}: {r.count}
          </li>
        ))}
      </ul>
    </section>
  )
}

export default function Dashboard() {
  const [importOpen, setImportOpen] = useState(false)
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: dashboardApi.getSummary,
  })

  if (isLoading)
    return (
      <div className="space-y-6" aria-busy="true">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      </div>
    )

  if (isError || !data)
    return (
      <div className={`${card} text-center`} role="alert">
        <p>Não foi possível carregar o painel.</p>
        <Button className="mt-3 min-h-11" onClick={() => refetch()}>
          Tentar novamente
        </Button>
      </div>
    )

  if (data.total_items === 0)
    return (
      <div className={`${card} mx-auto max-w-xl py-12 text-center`}>
        <h1 className="font-display text-2xl font-semibold">Bem-vindo à sua coleção</h1>
        <p className="mt-2 text-muted-foreground">
          Ainda não há moedas cadastradas. Comece cadastrando uma ou importando sua planilha.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild className="min-h-11 rounded-full">
            <Link to="/admin/coins/new">Cadastrar primeira moeda</Link>
          </Button>
          <Button variant="outline" className="min-h-11 rounded-full" onClick={() => setImportOpen(true)}>
            Importar planilha
          </Button>
        </div>
        <ImportDialog
          open={importOpen}
          onOpenChange={(o) => {
            setImportOpen(o)
            if (!o) refetch()
          }}
        />
      </div>
    )

  const countries = topN(
    data.by_country.map((c) => ({ label: c.country, count: c.count })),
    10,
  )
  const originality = data.by_originality.map((o) => ({
    label: originalityLabel(o.originality),
    count: o.count,
  }))
  const categories = data.by_category.map((c) => ({ label: c.category, count: c.count }))

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-semibold">Painel</h1>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        <Kpi label="Peças" value={data.total_pieces} sub={`${data.total_items} moedas cadastradas`} />
        <Kpi label="Países" value={data.total_countries} />
        <Kpi label="Valor estimado" value={formatBRL(data.total_estimated_value)} />
        <Kpi label="Investido" value={formatBRL(data.total_invested)} />
        <Kpi label="À venda" value={data.total_for_sale} sub="moedas" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <BarCard title="Por país" rows={countries} colorful />
        <BarCard title="Por década" rows={groupByDecade(data.by_year)} />
        <BarCard title="Por originalidade" rows={originality} colorful />
        <BarCard title="Por categoria" rows={categories} colorful />
      </div>

      <section className={card} aria-label="Adicionadas recentemente">
        <h2 className="font-display text-lg font-semibold">Adicionadas recentemente</h2>
        <ul className="mt-3 divide-y divide-border">
          {data.recent.map((c) => {
            const img = resolveImageUrl(c.image_url_front)
            return (
              <li key={c.id}>
                <Link
                  to={`/admin/coins/edit/${c.id}`}
                  className="flex min-h-11 items-center gap-3 py-2 hover:text-foreground/80"
                >
                  <div className="coin-stage h-12 w-12 shrink-0 overflow-hidden rounded-full">
                    {img && <img src={img} alt={`Moeda ${c.title}`} className="h-full w-full object-cover" />}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{c.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {c.country} · {c.year}
                    </p>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}
