import { AxiosError, AxiosHeaders } from "axios"
import { expect, it } from "vitest"
import { apiErrorMessage } from "./api"

const err = (status: number, data: unknown) => new AxiosError("x", "ERR", undefined, undefined,
  { status, data, statusText: "", headers: {}, config: { headers: new AxiosHeaders() } })

it("401 é sessão expirada", () => expect(apiErrorMessage(err(401, {}), "f")).toBe("Sessão expirada. Entre novamente."))
it("usa detail string", () => expect(apiErrorMessage(err(413, { detail: "Imagem maior que 10 MB." }), "f")).toBe("Imagem maior que 10 MB."))
it("junta erros do pydantic", () => expect(apiErrorMessage(err(422, { detail: [{ msg: "a" }, { msg: "b" }] }), "f")).toBe("a; b"))
it("sem resposta é rede", () => expect(apiErrorMessage(new AxiosError("x"), "f")).toBe("Servidor indisponível. Verifique a conexão."))
it("desconhecido usa fallback", () => expect(apiErrorMessage(new Error("x"), "f")).toBe("f"))
