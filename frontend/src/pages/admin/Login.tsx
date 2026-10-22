import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"
import { authApi, apiErrorMessage } from "@/lib/api"
import { BRAND_NAME } from "@/lib/brand"
import axios from "axios"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"

export default function AdminLogin() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [totpCode, setTotpCode] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isWaitingForMfa, setIsWaitingForMfa] = useState(false)
  const { login, finishMfaLogin, isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { toast } = useToast()
  // Only same-app admin paths (no "//host" tricks) to prevent open redirects.
  const next = searchParams.get("next")
  const destination =
    next && /^\/admin(\/|$|\?)/.test(next) ? next : "/admin/dashboard"
  // 401 here means bad credentials, not an expired session.
  const authError = (err: unknown, fallback: string) =>
    axios.isAxiosError(err) && err.response?.status === 401
      ? fallback
      : apiErrorMessage(err, fallback)

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate(destination, { replace: true })
    }
  }, [isAuthenticated, isLoading, navigate, destination])

  const handlePrimaryLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive",
      })
      return
    }
    setLoading(true)
    try {
      const response = await login(email, password)
      if (response.mfa_required) {
        setIsWaitingForMfa(true)
      } else {
        toast({
          title: "Bem-vindo!",
          description: "Login realizado com sucesso.",
        })
        navigate(destination)
      }
    } catch (err) {
      toast({
        title: "Erro de autenticação",
        description: authError(err, "Email ou senha inválidos."),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleMfaLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!totpCode) {
      toast({
        title: "Erro",
        description: "Por favor, insira o código de verificação.",
        variant: "destructive",
      })
      return
    }
    setLoading(true)
    try {
      const token = await authApi.loginMfa(email, password, totpCode)
      finishMfaLogin(token)
      toast({
        title: "Bem-vindo!",
        description: "Login realizado com sucesso.",
      })
      navigate(destination)
    } catch (err) {
      toast({
        title: "Erro de autenticação",
        description: authError(err, "Código MFA inválido."),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md">
        {/* Marca */}
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-3">
            <span
              aria-hidden="true"
              className="flex h-12 w-12 items-center justify-center rounded-full bg-accent font-display text-xl font-semibold text-accent-foreground"
            >
              {BRAND_NAME[0]}
            </span>
            <span className="font-display text-2xl font-semibold text-foreground">
              {BRAND_NAME}
            </span>
          </Link>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl bg-card p-6 shadow-elegant sm:p-8">
          {!isWaitingForMfa ? (
            <>
              <div className="text-center mb-8">
                <h1 className="font-display text-2xl font-semibold text-foreground">
                  Acesso Administrativo
                </h1>
                <p className="mt-2 text-muted-foreground">
                  Entre com suas credenciais para continuar
                </p>
              </div>
              <form onSubmit={handlePrimaryLogin} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-normal text-muted-foreground">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    className="h-[46px] rounded-xl text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-xs font-normal text-muted-foreground">Senha</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      className="h-[46px] rounded-xl pr-12 text-base"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                      className="absolute right-0 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
                <Button
                  type="submit"
                  variant="accent"
                  size="xl"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" /> Entrando...
                    </>
                  ) : (
                    "Entrar"
                  )}
                </Button>
              </form>
            </>
          ) : (
            <>
              <div className="text-center mb-8">
                <h1 className="font-display text-2xl font-semibold text-foreground">
                  Verificação de Dois Fatores
                </h1>
                <p className="mt-2 text-muted-foreground">
                  Insira o código do seu aplicativo autenticador.
                </p>
              </div>
              <form onSubmit={handleMfaLogin} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="totp-code" className="text-xs font-normal text-muted-foreground">Código de Verificação</Label>
                  <Input
                    id="totp-code"
                    type="text"
                    placeholder="123456"
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value)}
                    disabled={loading}
                    className="h-[46px] rounded-xl text-center text-lg tracking-widest"
                    maxLength={6}
                    inputMode="numeric"
                    pattern="[0-9]*"
                  />
                </div>
                <Button
                  type="submit"
                  variant="accent"
                  size="xl"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />{" "}
                      Verificando...
                    </>
                  ) : (
                    "Verificar e Entrar"
                  )}
                </Button>
              </form>
            </>
          )}

          <div className="mt-6 text-center">
            <Link
              to="/"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Voltar ao mostruário
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
