import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { API_URL, Coin, CoinCreate, coinsApi } from "@/lib/api"
import { ArrowLeft, ImageIcon, Loader2, Save } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"

const originalityOptions = [
  { value: "original", label: "Original" },
  { value: "replica", label: "Réplica" },
  { value: "unknown", label: "Desconhecida" },
] as const

type OriginalityValue = (typeof originalityOptions)[number]["value"]

function toInputDateTimeLocal(iso?: string | null) {
  if (!iso) return ""
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  const pad = (n: number) => String(n).padStart(2, "0")
  const yyyy = d.getFullYear()
  const mm = pad(d.getMonth() + 1)
  const dd = pad(d.getDate())
  const hh = pad(d.getHours())
  const mi = pad(d.getMinutes())
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`
}

function fromInputDateTimeLocal(value: string) {
  if (!value) return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString()
}

function normalizeOriginality(value: any): OriginalityValue {
  const v = String(value ?? "").toLowerCase()
  if (v === "original") return "original"
  if (v === "replica") return "replica"
  return "unknown"
}

function resolveImageUrl(url?: string | null) {
  if (!url) return null
  const u = String(url).trim()
  if (!u || u === "string") return null
  if (u.startsWith("http://") || u.startsWith("https://")) return u
  return `${String(API_URL).replace(/\/$/, "")}/${u.replace(/^\//, "")}`
}

export default function CoinForm() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const isEditing = !!id

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const [frontImage, setFrontImage] = useState<File | null>(null)
  const [backImage, setBackImage] = useState<File | null>(null)
  const [frontPreview, setFrontPreview] = useState<string | null>(null)
  const [backPreview, setBackPreview] = useState<string | null>(null)

  const [form, setForm] = useState<
    CoinCreate & {
      quantity: number
      purchase_price?: number | null
      storage_location?: string
      category?: string
      acquisition_date?: string | null
      acquisition_source?: string
      notes?: string
    }
  >({
    quantity: 1,
    country: "",
    year: new Date().getFullYear(),
    face_value: "",
    purchase_price: null,
    estimated_value: 0,
    originality: "unknown" as any,
    condition: "",
    storage_location: "",
    category: "",
    acquisition_date: null,
    acquisition_source: "",
    notes: "",
  } as any)

  const acquisitionDateLocal = useMemo(
    () => toInputDateTimeLocal((form as any).acquisition_date),
    [form]
  )

  useEffect(() => {
    if (!isEditing) return

    setLoading(true)
    coinsApi
      .get(parseInt(id))
      .then((coin: Coin & any) => {
        setForm((prev) => ({
          ...prev,
          quantity: coin.quantity ?? 1,
          country: coin.country ?? "",
          year: Number(coin.year ?? new Date().getFullYear()),
          face_value: coin.face_value ?? "",
          purchase_price:
            coin.purchase_price === null || coin.purchase_price === undefined
              ? null
              : Number(coin.purchase_price),
          estimated_value:
            coin.estimated_value === null || coin.estimated_value === undefined
              ? 0
              : Number(coin.estimated_value),
          originality: normalizeOriginality(coin.originality) as any,
          condition: coin.condition ?? "",
          storage_location: coin.storage_location ?? "",
          category: coin.category ?? "",
          acquisition_date: coin.acquisition_date ?? null,
          acquisition_source: coin.acquisition_source ?? "",
          notes: coin.notes ?? "",
        }))

        // Imagens: image_url_front/back (pode vir relativa ou absoluta)
        setFrontPreview(resolveImageUrl(coin.image_url_front))
        setBackPreview(resolveImageUrl(coin.image_url_back))
      })
      .catch(() => {
        toast({
          title: "Erro",
          description: "Moeda não encontrada.",
          variant: "destructive",
        })
        navigate("/admin/coins")
      })
      .finally(() => setLoading(false))
  }, [id, isEditing, navigate, toast])

  const handleImageChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "front" | "back"
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (type === "front") {
      setFrontImage(file)
      setFrontPreview(URL.createObjectURL(file))
    } else {
      setBackImage(file)
      setBackPreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.country || !form.face_value || !form.year) {
      toast({
        title: "Erro",
        description: "Por favor, preencha País, Ano e Valor de Face.",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      let coin: Coin

      const payload: any = {
        ...form,
        originality: normalizeOriginality((form as any).originality),
      }

      if ("acquisition_date" in payload) {
        payload.acquisition_date = payload.acquisition_date || null
      }

      if ("purchase_price" in payload) {
        payload.purchase_price =
          payload.purchase_price === "" || payload.purchase_price === undefined
            ? null
            : payload.purchase_price
      }

      if (isEditing) {
        coin = await coinsApi.update(parseInt(id), payload)
      } else {
        coin = await coinsApi.create(payload)
      }

      if (frontImage || backImage) {
        await coinsApi.uploadImages(
          coin.id,
          frontImage || undefined,
          backImage || undefined
        )
      }

      toast({
        title: "Sucesso",
        description: isEditing
          ? "Moeda atualizada com sucesso."
          : "Moeda criada com sucesso.",
      })
      navigate("/admin/coins")
    } catch {
      toast({
        title: "Erro",
        description: "Não foi possível salvar a moeda.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <Button
          variant="ghost"
          className="mb-4 gap-2"
          onClick={() => navigate("/admin/coins")}
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>

        <h1 className="font-display text-3xl font-bold text-foreground">
          {isEditing ? "Editar Moeda" : "Nova Moeda"}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {isEditing
            ? "Atualize as informações da moeda"
            : "Preencha os dados para adicionar uma nova moeda"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Imagens */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 font-display text-xl font-semibold">Imagens</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {/* Frente */}
            <div className="space-y-2">
              <Label>Imagem da Frente</Label>
              <div className="relative isolate aspect-square overflow-hidden rounded-lg border-2 border-dashed border-border bg-muted/50">
                {frontPreview ? (
                  <img
                    src={frontPreview}
                    alt="Frente"
                    className="h-full w-full object-cover"
                    onError={() => setFrontPreview(null)}
                  />
                ) : (
                  <div className="relative z-10 flex h-full w-full flex-col items-center justify-center">
                    <div className="rounded-xl bg-muted/60 p-3">
                      <ImageIcon className="h-12 w-12 stroke-[1.5] text-foreground/60" />
                    </div>
                    <span className="mt-2 text-sm text-muted-foreground">
                      Clique para selecionar
                    </span>
                  </div>
                )}

                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageChange(e, "front")}
                  className="absolute inset-0 z-20 cursor-pointer opacity-0"
                />
              </div>
            </div>

            {/* Verso */}
            <div className="space-y-2">
              <Label>Imagem do Verso</Label>
              <div className="relative isolate aspect-square overflow-hidden rounded-lg border-2 border-dashed border-border bg-muted/50">
                {backPreview ? (
                  <img
                    src={backPreview}
                    alt="Verso"
                    className="h-full w-full object-cover"
                    onError={() => setBackPreview(null)}
                  />
                ) : (
                  <div className="relative z-10 flex h-full w-full flex-col items-center justify-center">
                    <div className="rounded-xl bg-muted/60 p-3">
                      <ImageIcon className="h-12 w-12 stroke-[1.5] text-foreground/60" />
                    </div>
                    <span className="mt-2 text-sm text-muted-foreground">
                      Clique para selecionar
                    </span>
                  </div>
                )}

                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageChange(e, "back")}
                  className="absolute inset-0 z-20 cursor-pointer opacity-0"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Informações Básicas */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 font-display text-xl font-semibold">
            Informações Básicas
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="country">País *</Label>
              <Input
                id="country"
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
                placeholder="Ex: Brasil"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="year">Ano *</Label>
              <Input
                id="year"
                type="number"
                value={form.year}
                onChange={(e) =>
                  setForm({
                    ...form,
                    year: Number(e.target.value || new Date().getFullYear()),
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="face_value">Valor de Face *</Label>
              <Input
                id="face_value"
                value={(form as any).face_value ?? ""}
                onChange={(e) =>
                  setForm({ ...form, face_value: e.target.value } as any)
                }
                placeholder='Ex: "1 Real", "10 Centavos"'
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantidade</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={(form as any).quantity ?? 1}
                onChange={(e) =>
                  setForm({
                    ...form,
                    quantity: Number(e.target.value || 1),
                  } as any)
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Input
                id="category"
                value={(form as any).category ?? ""}
                onChange={(e) =>
                  setForm({ ...(form as any), category: e.target.value })
                }
                placeholder="Ex: Comemorativa"
              />
            </div>
          </div>
        </div>

        {/* Valores & Procedência */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 font-display text-xl font-semibold">
            Valores & Procedência
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="purchase_price">Preço de compra</Label>
              <Input
                id="purchase_price"
                type="number"
                step="0.01"
                value={(form as any).purchase_price ?? ""}
                onChange={(e) => {
                  const raw = e.target.value
                  setForm({
                    ...(form as any),
                    purchase_price: raw === "" ? null : Number(raw),
                  })
                }}
                placeholder="Ex: 10.50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimated_value">Valor estimado</Label>
              <Input
                id="estimated_value"
                type="number"
                step="0.01"
                value={(form as any).estimated_value ?? 0}
                onChange={(e) =>
                  setForm({
                    ...(form as any),
                    estimated_value: Number(e.target.value || 0),
                  })
                }
                placeholder="Ex: 25.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="acquisition_source">Origem/Aquisição</Label>
              <Input
                id="acquisition_source"
                value={(form as any).acquisition_source ?? ""}
                onChange={(e) =>
                  setForm({
                    ...(form as any),
                    acquisition_source: e.target.value,
                  })
                }
                placeholder="Ex: Herança"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="acquisition_date">Data de aquisição</Label>
              <Input
                id="acquisition_date"
                type="datetime-local"
                value={acquisitionDateLocal}
                onChange={(e) => {
                  const iso = fromInputDateTimeLocal(e.target.value)
                  setForm({ ...(form as any), acquisition_date: iso })
                }}
              />
            </div>
          </div>
        </div>

        {/* Detalhes */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 font-display text-xl font-semibold">Detalhes</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="originality">Originalidade</Label>
              <Select
                value={normalizeOriginality((form as any).originality)}
                onValueChange={(value) =>
                  setForm({ ...(form as any), originality: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {originalityOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="condition">Condição</Label>
              <Input
                id="condition"
                value={(form as any).condition ?? ""}
                onChange={(e) =>
                  setForm({ ...(form as any), condition: e.target.value })
                }
                placeholder="Ex: Flor de Cunho"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="storage_location">Local de armazenamento</Label>
              <Input
                id="storage_location"
                value={(form as any).storage_location ?? ""}
                onChange={(e) =>
                  setForm({
                    ...(form as any),
                    storage_location: e.target.value,
                  })
                }
                placeholder='Ex: "Álbum 1, p. 3"'
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                value={(form as any).notes ?? ""}
                onChange={(e) =>
                  setForm({ ...(form as any), notes: e.target.value })
                }
                placeholder="Ex: Moeda rara do plano Real."
                rows={4}
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/admin/coins")}
          >
            Cancelar
          </Button>

          <Button
            type="submit"
            variant="gold"
            disabled={saving}
            className="gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Salvar Moeda
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
