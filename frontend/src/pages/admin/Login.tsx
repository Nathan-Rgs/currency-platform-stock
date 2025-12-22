import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"
import { authApi } from "@/lib/api"
import { Coins, Eye, EyeOff, Loader2 } from "lucide-react"
import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"

export default function AdminLogin() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [totpCode, setTotpCode] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isWaitingForMfa, setIsWaitingForMfa] = useState(false)
  const { login, finishMfaLogin } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

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
        navigate("/admin/dashboard")
      }
    } catch (err: any) {
      toast({
        title: "Erro de autenticação",
        description: err.response?.data?.detail || "Email ou senha inválidos.",
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
      navigate("/admin/dashboard")
    } catch (err: any) {
      toast({
        title: "Erro de autenticação",
        description: err.response?.data?.detail || "Código MFA inválido.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary px-4">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gold/20">
              <Coins className="h-7 w-7 text-gold" />
            </div>
            <span className="font-display text-3xl font-bold text-primary-foreground">
              Numis<span className="text-gold">Admin</span>
            </span>
          </Link>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl border border-border/10 bg-card p-8 shadow-elegant animate-scaleIn">
          {!isWaitingForMfa ? (
            <>
              <div className="text-center mb-8">
                <h1 className="font-display text-2xl font-bold text-foreground">
                  Acesso Administrativo
                </h1>
                <p className="mt-2 text-muted-foreground">
                  Entre com suas credenciais para continuar
                </p>
              </div>
              <form onSubmit={handlePrimaryLogin} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      className="h-12 pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
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
                  variant="gold"
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
                <h1 className="font-display text-2xl font-bold text-foreground">
                  Verificação de Dois Fatores
                </h1>
                <p className="mt-2 text-muted-foreground">
                  Insira o código do seu aplicativo autenticador.
                </p>
              </div>
              <form onSubmit={handleMfaLogin} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="totp-code">Código de Verificação</Label>
                  <Input
                    id="totp-code"
                    type="text"
                    placeholder="123456"
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value)}
                    disabled={loading}
                    className="h-12 text-center tracking-widest text-lg"
                    maxLength={6}
                    inputMode="numeric"
                    pattern="[0-9]*"
                  />
                </div>
                <Button
                  type="submit"
                  variant="gold"
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
              className="text-sm text-muted-foreground hover:text-gold transition-colors"
            >
              ← Voltar ao mostruário
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
