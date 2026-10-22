import { AxiosError, AxiosHeaders } from "axios"
import { afterEach, expect, it, vi } from "vitest"
import { api, apiErrorMessage } from "./api"

const err = (status: number, data: unknown) => new AxiosError("x", "ERR", undefined, undefined,
  { status, data, statusText: "", headers: {}, config: { headers: new AxiosHeaders() } })

it("401 é sessão expirada", () => expect(apiErrorMessage(err(401, {}), "f")).toBe("Sessão expirada. Entre novamente."))
it("usa detail string", () => expect(apiErrorMessage(err(413, { detail: "Imagem maior que 10 MB." }), "f")).toBe("Imagem maior que 10 MB."))
it("junta erros do pydantic", () => expect(apiErrorMessage(err(422, { detail: [{ msg: "a" }, { msg: "b" }] }), "f")).toBe("a; b"))
it("sem resposta é rede", () => expect(apiErrorMessage(new AxiosError("x"), "f")).toBe("Servidor indisponível. Verifique a conexão."))
it("desconhecido usa fallback", () => expect(apiErrorMessage(new Error("x"), "f")).toBe("f"))

const fail401 = (method: "get" | "post") =>
  api.request({ url: "/coins", method, adapter: (config) => Promise.reject(
    new AxiosError("x", "ERR", config, undefined, { status: 401, data: {}, statusText: "", headers: {}, config })) }).catch(() => {})

const mockLocation = () => {
  const assign = vi.fn()
  vi.stubGlobal("localStorage", { getItem: () => null, removeItem: vi.fn() })
  vi.stubGlobal("window", { location: { pathname: "/admin/coins", search: "", assign } })
  return assign
}
afterEach(() => vi.unstubAllGlobals())

it("401 em POST não redireciona", async () => {
  const assign = mockLocation()
  await fail401("post")
  expect(assign).not.toHaveBeenCalled()
})
it("401 em GET no admin redireciona", async () => {
  const assign = mockLocation()
  await fail401("get")
  expect(assign).toHaveBeenCalledWith("/admin/login?next=%2Fadmin%2Fcoins")
})
