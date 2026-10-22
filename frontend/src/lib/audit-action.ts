// pt-BR label + AA-contrast pill colors per audit action.
export const AUDIT_ACTIONS: Record<string, { label: string; className: string }> = {
  create: { label: "Criação", className: "bg-success-bg text-success" },
  update: { label: "Edição", className: "bg-blue-50 text-blue-800" },
  delete: { label: "Exclusão", className: "bg-red-50 text-red-800" },
  import: { label: "Importação", className: "bg-violet-50 text-violet-800" },
  adjust_in: { label: "Entrada de estoque", className: "bg-teal-50 text-teal-800" },
  adjust_out: { label: "Saída de estoque", className: "bg-amber-50 text-amber-900" },
}

export const auditActionLabel = (action: string) =>
  AUDIT_ACTIONS[action]?.label ?? action
