import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Coin, CoinFacets, coinsApi, publicApi } from "@/lib/api"
import {
  CONDITION_OPTIONS,
  ORIGINALITY_OPTIONS,
  resolveImageUrl,
} from "@/lib/coin-format"
import {
  coinFormSchema,
  CoinFormParsed,
  CoinFormValues,
  coinToFormValues,
  emptyCoinFormValues,
  toCoinPayload,
} from "@/lib/coin-schema"
import { apiErrorMessage } from "@/lib/api"
import { cn } from "@/lib/utils"
import { zodResolver } from "@hookform/resolvers/zod"
import axios from "axios"
import { Camera, Loader2, Lock, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useForm, useFormContext } from "react-hook-form"
import { useNavigate, useParams, useSearchParams } from "react-router-dom"

const apiErrorDetail = (e: unknown) =>
  apiErrorMessage(e, "Não foi possível salvar. Tente novamente.")

const inputClass = "h-[46px] rounded-xl border-border text-base md:text-base"
const labelClass = "text-xs font-normal text-muted-foreground"
const sectionClass = "space-y-3 rounded-2xl bg-card p-4 shadow-elegant"
const sectionTitleClass = "text-xs font-medium uppercase tracking-wide text-muted-foreground"

type TextName = Exclude<keyof CoinFormValues, "for_sale" | "originality">

function TextField({
  name,
  label,
  className,
  ...props
}: { name: TextName; label: string } & React.ComponentProps<"input">) {
  const { control } = useFormContext<CoinFormValues>()
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={cn("min-w-0 space-y-1.5", className)}>
          <FormLabel className={labelClass}>{label}</FormLabel>
          <FormControl>
            <Input
              {...props}
              {...field}
              value={(field.value as string | undefined) ?? ""}
              className={inputClass}
            />
          </FormControl>
          <FormMessage className="text-xs" />
        </FormItem>
      )}
    />
  )
}

function TextAreaField({ name, label }: { name: TextName; label: string }) {
  const { control } = useFormContext<CoinFormValues>()
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="space-y-1.5">
          <FormLabel className={labelClass}>{label}</FormLabel>
          <FormControl>
            <Textarea
              {...field}
              value={(field.value as string | undefined) ?? ""}
              rows={3}
              className="rounded-xl border-border text-base md:text-base"
            />
          </FormControl>
          <FormMessage className="text-xs" />
        </FormItem>
      )}
    />
  )
}

function Chip({
  active,
  title,
  onClick,
  children,
}: {
  active: boolean
  title?: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      title={title}
      onClick={onClick}
      className={cn(
        "h-11 min-w-[52px] rounded-full px-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active
          ? "bg-primary font-semibold text-primary-foreground"
          : "border border-border text-foreground hover:bg-muted",
      )}
    >
      {children}
    </button>
  )
}

type Photo = { file: File | null; preview: string | null; stored: string | null }
const noPhoto: Photo = { file: null, preview: null, stored: null }

function PhotoPicker({
  label,
  photo,
  primary,
  onPick,
  onRemove,
}: {
  label: string
  photo: Photo
  primary: boolean
  onPick: (file: File) => void
  onRemove: () => void
}) {
  return (
    <div className="relative">
      <label
        className={cn(
          "flex h-[170px] cursor-pointer flex-col items-center justify-center gap-2.5 overflow-hidden rounded-2xl text-sm focus-within:ring-2 focus-within:ring-ring",
          photo.preview || primary
            ? "coin-stage font-semibold text-foreground"
            : "border border-dashed border-[#D9CFB4] bg-card text-muted-foreground",
        )}
      >
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="environment"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0]
            e.target.value = ""
            if (file) onPick(file)
          }}
        />
        {photo.preview ? (
          <>
            <img src={photo.preview} alt={`Foto ${label.toLowerCase()}`} className="h-[130px] w-full object-contain" />
            <span>{label}</span>
          </>
        ) : (
          <>
            <span
              className={cn(
                "flex h-14 w-14 items-center justify-center rounded-full",
                primary ? "bg-accent text-foreground" : "border border-[#D9CFB4]",
              )}
            >
              <Camera className="h-6 w-6" aria-hidden="true" />
            </span>
            <span>{label}</span>
          </>
        )}
      </label>
      {photo.file && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remover foto ${label.toLowerCase()} selecionada`}
          className="absolute right-1 top-1 flex h-11 w-11 items-center justify-center rounded-full text-foreground"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-card shadow-elegant">
            <X className="h-4 w-4" aria-hidden="true" />
          </span>
        </button>
      )}
    </div>
  )
}

export default function CoinForm() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const isEditing = !!id
  const fromId = useSearchParams()[0].get("from")
  const [duplicatingTitle, setDuplicatingTitle] = useState<string | null>(null)

  const form = useForm<CoinFormValues, unknown, CoinFormParsed>({
    resolver: zodResolver(coinFormSchema),
    defaultValues: emptyCoinFormValues,
  })
  const [loading, setLoading] = useState(isEditing)
  const [facets, setFacets] = useState<CoinFacets | null>(null)
  const [otherCondition, setOtherCondition] = useState(false)
  const [front, setFront] = useState<Photo>(noPhoto)
  const [back, setBack] = useState<Photo>(noPhoto)
  const savingRef = useRef(false)

  useEffect(() => {
    publicApi.facets().then(setFacets).catch(() => {})
  }, [])

  useEffect(() => {
    if (!id) return
    setLoading(true)
    coinsApi
      .get(Number(id))
      .then((coin: Coin) => {
        const values = coinToFormValues(coin)
        form.reset(values)
        setOtherCondition(!!values.condition && !CONDITION_OPTIONS.includes(values.condition))
        const f = resolveImageUrl(coin.image_url_front)
        const b = resolveImageUrl(coin.image_url_back)
        setFront({ file: null, preview: f, stored: f })
        setBack({ file: null, preview: b, stored: b })
        setLoading(false)
      })
      .catch((e) => {
        // Never leave an empty form editable: saving it would overwrite the coin.
        const notFound = axios.isAxiosError(e) && e.response?.status === 404
        toast({
          title: notFound ? "Moeda não encontrada." : "Não foi possível carregar a moeda.",
          description: notFound ? undefined : apiErrorDetail(e),
          variant: "destructive",
        })
        navigate("/admin/coins")
      })
  }, [id, form, navigate, toast])

  // Duplicar: copia os campos da moeda de origem, sem fotos.
  useEffect(() => {
    if (id || !fromId) return
    coinsApi
      .get(Number(fromId))
      .then((coin: Coin) => {
        const values = coinToFormValues(coin)
        form.reset(values)
        setOtherCondition(!!values.condition && !CONDITION_OPTIONS.includes(values.condition))
        setDuplicatingTitle(coin.title)
      })
      .catch((e) =>
        toast({
          title: "Não foi possível carregar a moeda de origem.",
          description: apiErrorDetail(e),
          variant: "destructive",
        }),
      )
  }, [id, fromId, form, toast])

  const pick = (set: typeof setFront) => (file: File) =>
    set((p) => {
      if (p.file && p.preview) URL.revokeObjectURL(p.preview)
      return { ...p, file, preview: URL.createObjectURL(file) }
    })
  const unpick = (set: typeof setFront) => () =>
    set((p) => {
      if (p.file && p.preview) URL.revokeObjectURL(p.preview)
      return { ...p, file: null, preview: p.stored }
    })

  const save = async (values: CoinFormParsed, addAnother: boolean) => {
    if (savingRef.current) return
    savingRef.current = true
    try {
      const payload = toCoinPayload(values)
      let coin: Coin
      try {
        coin = isEditing
          ? await coinsApi.update(Number(id), payload)
          : await coinsApi.create(payload)
      } catch (e) {
        toast({ title: "Não foi possível salvar", description: apiErrorDetail(e), variant: "destructive" })
        return
      }

      if (front.file || back.file) {
        try {
          await coinsApi.uploadImages(coin.id, front.file ?? undefined, back.file ?? undefined)
        } catch (e) {
          toast({
            title: `Moeda salva, mas a foto não foi enviada: ${apiErrorDetail(e)}`,
            variant: "destructive",
          })
          if (!isEditing) navigate(`/admin/coins/edit/${coin.id}`)
          return
        }
      }

      if (addAnother) {
        const v = form.getValues()
        form.reset({
          ...emptyCoinFormValues,
          country: v.country,
          category: v.category,
          material: v.material,
          acquisition_source: v.acquisition_source,
          storage_location: v.storage_location,
          for_sale: v.for_sale,
        })
        setOtherCondition(false)
        unpick(setFront)()
        unpick(setBack)()
        form.setFocus("title")
        toast({ title: "Moeda salva", description: "Pode cadastrar a próxima." })
        return
      }

      toast({ title: isEditing ? "Moeda atualizada" : "Moeda cadastrada" })
      navigate("/admin/coins")
    } finally {
      savingRef.current = false
    }
  }

  const saving = form.formState.isSubmitting
  const condition = form.watch("condition") ?? ""
  const originality = form.watch("originality")
  const forSale = form.watch("for_sale")

  const setCondition = (value: string) =>
    form.setValue("condition", value, { shouldDirty: true, shouldValidate: true })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32" role="status" aria-label="Carregando">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-4 flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-foreground">
          {isEditing ? "Editar moeda" : "Nova moeda"}
        </h1>
        <button
          type="button"
          aria-label="Fechar"
          onClick={() => navigate("/admin/coins")}
          className="flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </header>

      {duplicatingTitle && (
        <p className="mb-3 text-sm text-muted-foreground">Duplicando: {duplicatingTitle}</p>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit((v) => save(v, false))} noValidate className="space-y-3.5">
          {/* Fotos */}
          <section aria-label="Fotos" className="grid grid-cols-2 gap-2.5">
            <PhotoPicker label="Frente" photo={front} primary onPick={pick(setFront)} onRemove={unpick(setFront)} />
            <PhotoPicker label="Verso" photo={back} primary={false} onPick={pick(setBack)} onRemove={unpick(setBack)} />
          </section>

          {/* Identificação */}
          <section className={sectionClass}>
            <h2 className={sectionTitleClass}>Identificação</h2>
            <TextField name="title" label="Título *" placeholder="Ex.: 5 Francos Semeadora" autoComplete="off" />
            <div className="grid grid-cols-2 gap-2.5">
              <TextField name="country" label="País *" list="coin-countries" autoComplete="off" />
              <TextField name="year" label="Ano *" type="text" inputMode="numeric" />
              <TextField name="face_value" label="Valor de face *" autoComplete="off" />
              <TextField name="catalog_ref" label="Catálogo" placeholder="KM# 926" autoComplete="off" />
              <TextField name="quantity" label="Quantidade" type="text" inputMode="numeric" />
            </div>
            <datalist id="coin-countries">
              {facets?.countries.map((c) => <option key={c} value={c} />)}
            </datalist>
          </section>

          {/* Características */}
          <section className={sectionClass}>
            <h2 className={sectionTitleClass}>Características</h2>
            <div role="group" aria-labelledby="condition-label" className="space-y-1.5">
              <p id="condition-label" className={labelClass}>Conservação</p>
              <div className="flex flex-wrap gap-1.5">
                {CONDITION_OPTIONS.map((opt) => {
                  const code = opt.split(" ")[0]
                  const active = !otherCondition && condition === opt
                  return (
                    <Chip
                      key={opt}
                      active={active}
                      title={opt}
                      onClick={() => {
                        setOtherCondition(false)
                        setCondition(active ? "" : opt)
                      }}
                    >
                      <span aria-hidden="true">{code}</span>
                      <span className="sr-only">{opt}</span>
                    </Chip>
                  )
                })}
                <Chip
                  active={otherCondition}
                  onClick={() => {
                    if (otherCondition) {
                      setOtherCondition(false)
                      setCondition("")
                    } else {
                      setOtherCondition(true)
                      if (CONDITION_OPTIONS.includes(condition)) setCondition("")
                    }
                  }}
                >
                  Outra
                </Chip>
              </div>
              {otherCondition ? (
                <TextField name="condition" label="Outra conservação" autoFocus autoComplete="off" />
              ) : (
                form.formState.errors.condition && (
                  <p className="text-xs font-medium text-destructive">{form.formState.errors.condition.message}</p>
                )
              )}
            </div>

            <div role="group" aria-labelledby="originality-label" className="space-y-1.5">
              <p id="originality-label" className={labelClass}>Originalidade</p>
              <div className="flex flex-wrap gap-1.5">
                {ORIGINALITY_OPTIONS.map((o) => (
                  <Chip
                    key={o.value}
                    active={originality === o.value}
                    onClick={() => form.setValue("originality", o.value, { shouldDirty: true })}
                  >
                    {o.label}
                  </Chip>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <TextField name="material" label="Material" autoComplete="off" />
              <TextField name="mint_mark" label="Marca de casa" autoComplete="off" />
              <TextField name="diameter_mm" label="Diâmetro (mm)" type="text" inputMode="decimal" />
              <TextField name="weight_g" label="Peso (g)" type="text" inputMode="decimal" />
              <TextField name="category" label="Categoria" list="coin-categories" autoComplete="off" className="col-span-2" />
            </div>
            <datalist id="coin-categories">
              {facets?.categories.map((c) => <option key={c} value={c} />)}
            </datalist>
          </section>

          {/* Aquisição (privado) */}
          <section className={sectionClass}>
            <div className="flex items-center justify-between">
              <h2 className={sectionTitleClass}>Aquisição</h2>
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Lock className="h-3 w-3" aria-hidden="true" />
                Visível só para você
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <TextField name="purchase_price" label="Preço pago (R$)" type="text" inputMode="decimal" />
              <TextField name="estimated_value" label="Valor estimado (R$)" type="text" inputMode="decimal" />
              <TextField name="acquisition_source" label="Origem" autoComplete="off" />
              <TextField name="acquisition_date" label="Data" type="date" />
              <TextField name="storage_location" label="Local" placeholder="Álbum 2, p. 7" autoComplete="off" className="col-span-2" />
            </div>
            <TextAreaField name="notes" label="Notas" />
          </section>

          {/* Vitrine */}
          <section className={cn(sectionClass, "border border-accent")}>
            <h2 className={sectionTitleClass}>Vitrine</h2>
            <FormField
              name="for_sale"
              render={({ field }) => (
                <FormItem className="flex min-h-11 items-center justify-between space-y-0">
                  <FormLabel className="text-[15px] font-semibold">Colocar à venda</FormLabel>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        field.onChange(checked)
                        if (form.formState.isSubmitted) form.trigger("sale_price")
                      }}
                      className="data-[state=checked]:bg-accent"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              name="sale_price"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className={labelClass}>Preço de venda (R$){forSale ? " *" : ""}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      type="text"
                      inputMode="decimal"
                      className={cn(inputClass, "text-lg font-semibold md:text-lg")}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
            <TextAreaField name="public_description" label="Descrição pública" />
          </section>

          {/* Ações */}
          <div className="sticky bottom-0 z-10 -mx-4 flex gap-2 border-t border-border bg-background px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 md:static md:mx-0 md:justify-end md:border-0 md:bg-transparent md:px-0 md:pb-0">
            <Button
              type="submit"
              disabled={saving}
              variant={isEditing ? "accent" : "outline"}
              className={cn(
                "h-[52px] rounded-[14px] text-[15px] md:flex-none md:px-8",
                isEditing ? "flex-1" : "flex-1 border-border bg-card text-foreground",
              )}
            >
              {saving && <Loader2 className="animate-spin" aria-hidden="true" />}
              Salvar
            </Button>
            {!isEditing && (
              <Button
                type="button"
                variant="accent"
                disabled={saving}
                onClick={form.handleSubmit((v) => save(v, true))}
                className="h-[52px] flex-[2] rounded-[14px] text-[15px] text-foreground md:flex-none md:px-8"
              >
                Salvar e adicionar outra
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  )
}
