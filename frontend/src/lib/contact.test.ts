import { expect, it } from "vitest"
import { buildContactLinks } from "./contact"

const coin = { id: 7, title: "20 Réis 1889" }
it("monta link do WhatsApp com texto", () => {
  const { whatsapp } = buildContactLinks(coin, "https://x.com/coins/7", { whatsapp: "5511999999999" })
  expect(whatsapp).toBe("https://wa.me/5511999999999?text=" +
    encodeURIComponent('Olá! Tenho interesse na moeda "20 Réis 1889": https://x.com/coins/7'))
})
it("sem configuração devolve null", () =>
  expect(buildContactLinks(coin, "u", {})).toEqual({ whatsapp: null, email: null }))
it("mailto com assunto", () =>
  expect(buildContactLinks(coin, "u", { email: "a@b.com" }).email)
    .toBe("mailto:a@b.com?subject=" + encodeURIComponent("Interesse: 20 Réis 1889") + "&body=" + encodeURIComponent('Olá! Tenho interesse na moeda "20 Réis 1889": u')))
