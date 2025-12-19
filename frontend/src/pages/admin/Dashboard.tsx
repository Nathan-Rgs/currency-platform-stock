import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { dashboardApi, DashboardSummary } from "@/lib/api"
import {
  Calendar,
  Coins,
  Copy,
  DollarSign,
  Globe,
  Loader2,
  Percent,
  TrendingUp,
  Trophy,
} from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

const COLORS = ["#d4a84b", "#b8923f", "#9c7c33", "#806627", "#64501b"]

function formatCurrencyUSD(value: number) {
  return `$${(value ?? 0).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`
}

function EmptyState({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="flex h-[300px] w-full flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-6 text-center">
      <p className="font-display text-base font-semibold">{title}</p>
      {subtitle ? (
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      ) : null}
    </div>
  )
}

function CustomTooltip({
  active,
  payload,
  label,
  total,
  labelPrefix,
  labelSuffix,
}: any) {
  if (!active || !payload?.length) return null

  const value = payload[0]?.value ?? 0
  const pct = total > 0 ? (value / total) * 100 : 0

  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-sm">
      <p className="text-xs text-muted-foreground">
        {labelPrefix ? `${labelPrefix}: ` : ""}
        <span className="font-medium text-foreground">
          {label}
          {labelSuffix ?? ""}
        </span>
      </p>
      <p className="mt-1 text-sm font-semibold text-foreground">
        {value} moeda{value === 1 ? "" : "s"}{" "}
        <span className="text-xs font-normal text-muted-foreground">
          ({pct.toFixed(0)}%)
        </span>
      </p>
    </div>
  )
}

function DonutCenterLabel({
  total,
  primary,
  secondary,
}: {
  total: number
  primary: string
  secondary: string
}) {
  return (
    <g>
      <text
        x="50%"
        y="48%"
        textAnchor="middle"
        dominantBaseline="middle"
        className="fill-foreground"
        style={{ fontSize: 18, fontWeight: 800 }}
      >
        {primary}
      </text>
      <text
        x="50%"
        y="60%"
        textAnchor="middle"
        dominantBaseline="middle"
        className="fill-muted-foreground"
        style={{ fontSize: 12, fontWeight: 500 }}
      >
        {secondary}
      </text>
      <text
        x="50%"
        y="72%"
        textAnchor="middle"
        dominantBaseline="middle"
        className="fill-muted-foreground"
        style={{ fontSize: 11 }}
      >
        Total: {total}
      </text>
    </g>
  )
}

export default function AdminDashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const data = await dashboardApi.getSummary()
        setSummary(data)
      } catch (err) {
        // Demo data (fallback)
        setSummary({
          total_coins: 156,
          total_countries: 42,
          total_estimated_value: 45780,
          by_country: [
            { country: "Brasil", count: 35 },
            { country: "Portugal", count: 28 },
            { country: "EUA", count: 22 },
            { country: "França", count: 18 },
            { country: "Outros", count: 53 },
          ],
          by_year: [
            { year: 1800, count: 12 },
            { year: 1850, count: 25 },
            { year: 1900, count: 45 },
            { year: 1950, count: 38 },
            { year: 2000, count: 36 },
          ],
          by_originality: [
            { originality: "Original", count: 98 },
            { originality: "Réplica", count: 35 },
            { originality: "Restaurada", count: 23 },
          ],
        } as any)
      } finally {
        setLoading(false)
      }
    }

    fetchSummary()
  }, [])

  const computed = useMemo(() => {
    if (!summary) return null

    const totalCoins = summary.total_coins ?? 0
    const totalEstimated = summary.total_estimated_value ?? 0

    const byCountry = [...(summary.by_country ?? [])].sort(
      (a, b) => (b.count ?? 0) - (a.count ?? 0)
    )
    const byYear = [...(summary.by_year ?? [])].sort(
      (a, b) => (a.year ?? 0) - (b.year ?? 0)
    )
    const byOriginality = [...(summary.by_originality ?? [])].sort(
      (a, b) => (b.count ?? 0) - (a.count ?? 0)
    )

    const originals =
      byOriginality.find((o: any) => o.originality === "Original")?.count ?? 0
    const replicas =
      byOriginality.find((o: any) => o.originality === "Réplica")?.count ?? 0

    const originalsPct = totalCoins > 0 ? (originals / totalCoins) * 100 : 0
    const replicasPct = totalCoins > 0 ? (replicas / totalCoins) * 100 : 0
    const avgValue = totalCoins > 0 ? totalEstimated / totalCoins : 0

    const topCountry = byCountry[0]
    const topYear = (() => {
      if (!byYear.length) return null
      const max = [...byYear].sort((a, b) => (b.count ?? 0) - (a.count ?? 0))[0]
      return max
    })()

    const oldestYear = byYear[0]?.year
    const newestYear = byYear[byYear.length - 1]?.year

    const topCountries = byCountry.slice(0, 5)

    return {
      totalCoins,
      totalEstimated,
      byCountry,
      byYear,
      byOriginality,
      originals,
      replicas,
      originalsPct,
      replicasPct,
      avgValue,
      topCountry,
      topYear,
      oldestYear,
      newestYear,
      topCountries,
    }
  }, [summary])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    )
  }

  if (!summary || !computed) return null

  const statCards = [
    {
      title: "Total de Moedas",
      value: computed.totalCoins,
      icon: Coins,
      color: "text-gold",
      bgColor: "bg-gold/10",
    },
    {
      title: "Países",
      value: summary.total_countries ?? 0,
      icon: Globe,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Valor Estimado",
      value: formatCurrencyUSD(computed.totalEstimated),
      icon: DollarSign,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Valor Médio",
      value: formatCurrencyUSD(computed.avgValue),
      icon: TrendingUp,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      title: "Originais",
      value: computed.originals,
      icon: Percent,
      color: "text-emerald-600",
      bgColor: "bg-emerald-600/10",
      sub: `${computed.originalsPct.toFixed(0)}%`,
    },
    {
      title: "Réplicas",
      value: computed.replicas,
      icon: Copy,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
      sub: `${computed.replicasPct.toFixed(0)}%`,
    },
    {
      title: "Ano mais antigo",
      value: computed.oldestYear ?? "—",
      icon: Calendar,
      color: "text-sky-500",
      bgColor: "bg-sky-500/10",
    },
    {
      title: "Ano mais recente",
      value: computed.newestYear ?? "—",
      icon: Calendar,
      color: "text-indigo-500",
      bgColor: "bg-indigo-500/10",
    },
  ]

  const hasCountryData = (computed.byCountry?.length ?? 0) > 0
  const hasYearData = (computed.byYear?.length ?? 0) > 0
  const hasOriginalityData = (computed.byOriginality?.length ?? 0) > 0

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">
            Dashboard
          </h1>
          <p className="mt-1 text-muted-foreground">
            Visão geral da sua coleção de moedas
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <Card
            key={stat.title}
            className="border-border animate-fadeIn"
            style={{ animationDelay: `${index * 60}ms` }}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.bgColor}`}
                >
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="truncate font-display text-2xl font-bold">
                    {stat.value}
                  </p>
                  {"sub" in stat && stat.sub ? (
                    <p className="text-xs text-muted-foreground">
                      {stat.sub as any}
                    </p>
                  ) : null}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Insights + Top Countries */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-border lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-display">Insights rápidos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-3">
              <div className="rounded-xl border border-border bg-muted/20 px-3 py-2">
                <p className="text-xs text-muted-foreground">
                  País com mais moedas
                </p>
                <p className="font-semibold">
                  {computed.topCountry?.country ?? "—"}{" "}
                  {computed.topCountry?.count != null
                    ? `(${computed.topCountry.count})`
                    : ""}
                </p>
              </div>

              <div className="rounded-xl border border-border bg-muted/20 px-3 py-2">
                <p className="text-xs text-muted-foreground">Ano mais comum</p>
                <p className="font-semibold">
                  {computed.topYear?.year ?? "—"}{" "}
                  {computed.topYear?.count != null
                    ? `(${computed.topYear.count})`
                    : ""}
                </p>
              </div>

              <div className="rounded-xl border border-border bg-muted/20 px-3 py-2">
                <p className="text-xs text-muted-foreground">Distribuição</p>
                <p className="font-semibold">
                  {computed.originals} originais • {computed.replicas} réplicas
                </p>
              </div>

              <div className="rounded-xl border border-border bg-muted/20 px-3 py-2">
                <p className="text-xs text-muted-foreground">Valor médio</p>
                <p className="font-semibold">
                  {formatCurrencyUSD(computed.avgValue)}
                </p>
              </div>
            </div>

            {computed.totalCoins <= 2 ? (
              <div className="rounded-xl border border-dashed border-border bg-muted/10 px-4 py-3 text-sm text-muted-foreground">
                Sua coleção ainda tem poucos itens. Conforme você adicionar mais
                moedas, os gráficos vão revelar padrões por país e ano.
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-display">Top países</CardTitle>
            <Trophy className="h-5 w-5 text-gold" />
          </CardHeader>
          <CardContent className="space-y-3">
            {computed.topCountries.length ? (
              <div className="space-y-2">
                {computed.topCountries.map((c, idx) => {
                  const pct =
                    computed.totalCoins > 0
                      ? (c.count / computed.totalCoins) * 100
                      : 0
                  return (
                    <div
                      key={`${c.country}-${idx}`}
                      className="rounded-xl border border-border bg-muted/10 px-3 py-2"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="truncate font-medium">{c.country}</p>
                        <p className="whitespace-nowrap text-sm text-muted-foreground">
                          {c.count} • {pct.toFixed(0)}%
                        </p>
                      </div>
                      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-gold"
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Sem dados por país ainda.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* By Country Bar Chart */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="font-display">Moedas por País</CardTitle>
          </CardHeader>
          <CardContent>
            {!hasCountryData ? (
              <EmptyState
                title="Sem dados por país"
                subtitle="Cadastre moedas com o campo de país para ver a distribuição."
              />
            ) : (
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={computed.byCountry.slice(0, 10)}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                    />
                    <XAxis dataKey="country" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      content={(props) => (
                        <CustomTooltip
                          {...props}
                          total={computed.totalCoins}
                          labelPrefix="País"
                        />
                      )}
                    />
                    <Bar
                      dataKey="count"
                      fill="hsl(var(--gold))"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* By Originality Donut */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="font-display">Por Originalidade</CardTitle>
          </CardHeader>
          <CardContent>
            {!hasOriginalityData ? (
              <EmptyState
                title="Sem dados de originalidade"
                subtitle="Cadastre moedas com o campo de originalidade para ver a proporção."
              />
            ) : (
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={computed.byOriginality}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={110}
                      paddingAngle={4}
                      dataKey="count"
                      nameKey="originality"
                      isAnimationActive
                    >
                      {computed.byOriginality.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>

                    {/* Center label */}
                    <DonutCenterLabel
                      total={computed.totalCoins}
                      primary={`${computed.originals} / ${computed.totalCoins}`}
                      secondary="Originais"
                    />

                    <Tooltip
                      content={(props: any) => {
                        const p = props?.payload?.[0]?.payload
                        if (!props.active || !p) return null
                        const value = p.count ?? 0
                        const pct =
                          computed.totalCoins > 0
                            ? (value / computed.totalCoins) * 100
                            : 0
                        return (
                          <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-sm">
                            <p className="text-xs text-muted-foreground">
                              Tipo:{" "}
                              <span className="font-medium text-foreground">
                                {p.originality}
                              </span>
                            </p>
                            <p className="mt-1 text-sm font-semibold text-foreground">
                              {value} moeda{value === 1 ? "" : "s"}{" "}
                              <span className="text-xs font-normal text-muted-foreground">
                                ({pct.toFixed(0)}%)
                              </span>
                            </p>
                          </div>
                        )
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* By Year Bar Chart */}
        <Card className="border-border lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-display">Distribuição por Ano</CardTitle>
          </CardHeader>
          <CardContent>
            {!hasYearData ? (
              <EmptyState
                title="Sem dados por ano"
                subtitle="Cadastre moedas com o campo de ano para ver a distribuição."
              />
            ) : (
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={computed.byYear}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                    />
                    <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      content={(props) => (
                        <CustomTooltip
                          {...props}
                          total={computed.totalCoins}
                          labelPrefix="Ano"
                        />
                      )}
                    />
                    <Bar
                      dataKey="count"
                      fill="hsl(var(--gold))"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
