interface ContactEnv {
  whatsapp?: string
  email?: string
}

export function buildContactLinks(
  coin: { title: string; id: number },
  pageUrl: string,
  env: ContactEnv = {
    whatsapp: import.meta.env.VITE_CONTACT_WHATSAPP,
    email: import.meta.env.VITE_CONTACT_EMAIL,
  },
): { whatsapp: string | null; email: string | null } {
  const text = `Olá! Tenho interesse na moeda "${coin.title}": ${pageUrl}`
  return {
    whatsapp: env.whatsapp
      ? `https://wa.me/${env.whatsapp}?text=${encodeURIComponent(text)}`
      : null,
    email: env.email
      ? `mailto:${env.email}?subject=${encodeURIComponent(`Interesse: ${coin.title}`)}&body=${encodeURIComponent(text)}`
      : null,
  }
}
