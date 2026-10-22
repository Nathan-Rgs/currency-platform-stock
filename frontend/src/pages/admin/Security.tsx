import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { apiErrorMessage, authApi } from "@/lib/api"
import { Loader2, ShieldCheck, ShieldOff } from "lucide-react"
import QRCode from "qrcode.react"
import { useEffect, useState } from "react"

export default function SecurityPage() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isMfaEnabled, setIsMfaEnabled] = useState<boolean | null>(null)
  const [setupUri, setSetupUri] = useState<string | null>(null)
  const [verifyCode, setVerifyCode] = useState("")
  const [showSetupDialog, setShowSetupDialog] = useState(false)
  const [showDisableDialog, setShowDisableDialog] = useState(false)

  useEffect(() => {
    const fetchMfaStatus = async () => {
      try {
        const user = await authApi.getMe()
        setIsMfaEnabled(user.is_mfa_enabled)
      } catch (error) {
        toast({
          title: "Erro ao buscar status do MFA",
          description: apiErrorMessage(error, "Tente novamente."),
          variant: "destructive",
        })
      }
    }
    fetchMfaStatus()
  }, [toast])

  const handleEnableMfa = async () => {
    setIsLoading(true)
    try {
      const response = await authApi.setupMfa()
      setSetupUri(response.provisioning_uri)
      setShowSetupDialog(true)
    } catch (error) {
      const description = apiErrorMessage(
        error,
        "Ocorreu um erro ao configurar o MFA.",
      )
      toast({
        title: "Erro ao configurar MFA",
        description,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyMfa = async () => {
    if (!verifyCode) {
      toast({
        title: "Erro",
        description: "Por favor, insira o código de verificação.",
        variant: "destructive",
      })
      return
    }
    setIsLoading(true)
    try {
      await authApi.verifyMfa(verifyCode)
      toast({
        title: "Sucesso!",
        description: "A autenticação de múltiplos fatores foi ativada.",
      })
      setIsMfaEnabled(true)
      setShowSetupDialog(false)
      setSetupUri(null)
      setVerifyCode("")
    } catch (error) {
      toast({
        title: "Erro na verificação",
        description: apiErrorMessage(error, "Código inválido ou expirado."),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDisableMfa = async () => {
    if (!verifyCode) {
      toast({
        title: "Erro",
        description: "Por favor, insira o código de verificação atual.",
        variant: "destructive",
      })
      return
    }
    setIsLoading(true)
    try {
      await authApi.disableMfa(verifyCode)
      toast({
        title: "Sucesso!",
        description: "A autenticação de múltiplos fatores foi desativada.",
      })
      setIsMfaEnabled(false)
      setShowDisableDialog(false)
      setVerifyCode("")
    } catch (error) {
      toast({
        title: "Erro ao desativar",
        description: apiErrorMessage(error, "Código inválido ou erro inesperado."),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const renderStatus = () => {
    if (isMfaEnabled === null) {
      return <Skeleton className="h-8 w-48" />
    }
    if (isMfaEnabled) {
      return (
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-success">
            <ShieldCheck className="h-5 w-5" />
            <span className="text-sm font-medium">MFA está ATIVO</span>
          </div>
          <Button
            variant="destructive"
            onClick={() => setShowDisableDialog(true)}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Desativar"
            )}
          </Button>
        </div>
      )
    }
    return (
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-destructive">
          <ShieldOff className="h-5 w-5" />
          <span className="text-sm font-medium">MFA está DESATIVADO</span>
        </div>
        <Button onClick={handleEnableMfa} disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Ativar MFA"
          )}
        </Button>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8">
      <h1 className="mb-6 font-display text-2xl font-semibold text-foreground">
        Segurança da conta
      </h1>

      <section className="max-w-2xl space-y-4 rounded-2xl bg-card p-6 shadow-elegant">
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-foreground">
            Autenticação de múltiplos fatores (MFA)
          </h2>
          <p className="text-sm text-muted-foreground">
            Adicione uma camada extra de segurança à sua conta. Uma vez ativado,
            você precisará fornecer um código do seu aplicativo autenticador ao
            fazer login.
          </p>
        </div>
        {renderStatus()}
      </section>

      {/* Setup Dialog */}
      <Dialog open={showSetupDialog} onOpenChange={setShowSetupDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ativar Autenticação de Múltiplos Fatores</DialogTitle>
            <DialogDescription>
              1. Escaneie o QR Code abaixo com seu aplicativo autenticador
              (e.g., Google Authenticator, Authy).
              <br />
              2. Insira o código de 6 dígitos gerado pelo aplicativo para
              verificar.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-4">
            {setupUri && <QRCode value={setupUri} size={200} />}
          </div>
          <div className="space-y-2">
            <Label htmlFor="verify-code">Código de Verificação</Label>
            <Input
              id="verify-code"
              className="h-[46px] rounded-xl text-base"
              placeholder="123456"
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value)}
              inputMode="numeric"
              pattern="[0-9]*"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSetupDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleVerifyMfa} disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Verificar e Ativar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disable Dialog */}
      <Dialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Desativar Autenticação de Múltiplos Fatores
            </DialogTitle>
            <DialogDescription>
              Para desativar o MFA, por favor insira um código de verificação do
              seu aplicativo autenticador.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            <Label htmlFor="disable-code">Código de Verificação Atual</Label>
            <Input
              id="disable-code"
              className="h-[46px] rounded-xl text-base"
              inputMode="numeric"
              placeholder="123456"
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDisableDialog(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDisableMfa}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Confirmar e Desativar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
