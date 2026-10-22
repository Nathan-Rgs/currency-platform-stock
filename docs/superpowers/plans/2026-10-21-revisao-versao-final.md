# Revisão Completa — Versão Final para Catalogação — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Levar a plataforma (FastAPI + React) a uma versão final estável, segura e visualmente coesa, pronta para o dono cadastrar a coleção inteira e expor uma vitrine pública com intenção de venda.

**Architecture:** Backend ganha uma suíte pytest (SQLite em memória via override de `get_db`), separa a API pública (`/public/coins`, schema sem campos privados) da API autenticada (`/coins`), endurece uploads/importação e corrige o dashboard. Frontend centraliza helpers duplicados, ganha vitest para lógica pura, passa por uma fase de exploração visual (3 direções → escolha do dono) e depois cada tela é reescrita sobre os tokens escolhidos.

**Tech Stack:** FastAPI 0.110, SQLAlchemy 2.0, Alembic, Postgres 16, Pydantic 2; React 18, Vite 5, TypeScript, Tailwind 3, shadcn/ui, react-hook-form + zod (já instalados), @tanstack/react-query (instalado, hoje sem uso), recharts.

**Spec:** Não há spec separado. A seção **Decisões** abaixo é o spec; o executor lê as duas juntas.

---

## Decisões

| ID | Decisão | Estado |
|----|---------|--------|
| D1 | Galeria pública = **vitrine + venda**. Visitante vê a coleção; peças marcadas `for_sale` mostram preço de venda e botões de contato (WhatsApp / e-mail). | Decidido pelo dono |
| D2 | Campos **privados** (nunca na API pública): `purchase_price`, `estimated_value`, `storage_location`, `acquisition_source`, `acquisition_date`, `notes`, `owner_id`. Campo novo `public_description` para texto visível ao público. | Confirmado pelo dono |
| D3 | Campos numismáticos novos: `catalog_ref` (ex.: "KM# 652"), `material`, `diameter_mm`, `weight_g`, `mint_mark`. Adicionados **antes** de começar a catalogar, para não precisar revisitar peças. | Confirmado pelo dono |
| D4 | Nome único da marca: **"Santos Numismática"** (hoje há 4 nomes: `index.html`, "NumisGallery", "NumisAdmin", "Coin Collection Manager"). | Confirmado pelo dono |
| D5 | Registro público de usuários **desligado** (`ALLOW_REGISTRATION=False`). É uma coleção de um dono só. | Default |
| D6 | Direção visual **A+C — Gabinete Clássico minimalista** (canvas https://claude.ai/artifact/Jbe4M1F8GkyFxbCxnFmLyM, linha A+C). Paleta/tipografia do A, estrutura enxuta do C. Tokens: fundo `#F7F4EC`, superfície `#FFFFFF`, texto `#1F2430`, texto secundário `#5F6573`, linha `#E6E0D0`, palco da moeda `radial-gradient(#FFFFFF → #EFEADC)`, acento ouro `#C9A227` (só preenchimento, texto escuro por cima), ouro p/ texto `#7A5C0E`, sucesso `#1E5B33` sobre `#E4F1E8`. Fontes: Fraunces 600 (display) + Inter (corpo). Raio: cards 16px, inputs 12px, filtros/badges pill. Sem bordas em cards (sombra `0 1px 2px rgba(31,36,48,.05)`); nav ativa = pill grafite; preço em pill grafite no card; detalhe = moeda grande à esquerda + painel branco flutuante com ficha em blocos 2×2; conservação no form = chips de um toque. Sem header grafite. | Decidido pelo dono |

## Global Constraints

- Todo texto de UI em **pt-BR**; `index.html` com `lang="pt-BR"`.
- Dinheiro sempre via `Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })`.
- Toda mudança de model tem migration Alembic (`alembic revision --autogenerate`), revisada à mão antes do commit.
- Dependências novas permitidas: backend `pytest`, `httpx` (em `backend/requirements-dev.txt`); frontend `vitest` (devDependency). Nenhuma outra.
- Python 3.12 (`backend/venv`). Comandos backend rodam de `backend/`; frontend de `frontend/`.
- Gates por task: backend `venv/Scripts/python -m pytest -q` verde; frontend `npx tsc -p tsconfig.app.json --noEmit` sem erro e `npm run build` OK. A partir da Task 17, `npm run lint` com 0 erros.
- URL da API vem de `import.meta.env.VITE_API_URL` (default `http://localhost:8000`). Contato vem de `VITE_CONTACT_WHATSAPP` (só dígitos, com DDI, ex. `5511999999999`) e `VITE_CONTACT_EMAIL`.
- Commits em inglês, Conventional Commits, um por task.

## Review Focus

1. **CSV exportado/editado no Excel pt-BR** (delimitador `;`, BOM UTF-8) — importação deve funcionar igual a CSV com `,`. Teste: Task 6 `test_import_csv_semicolon_with_bom`.
2. **Vírgula decimal** ("10,50") digitada nos campos de preço/peso — deve virar `10.5`, não erro nem `NaN`. Teste: Task 14 `coinFormSchema` "aceita vírgula decimal".
3. **Foto de celular grande (>10 MB) ou formato não suportado** — resposta 413/415 com mensagem clara, moeda continua salva. Teste: Task 5 `test_upload_too_large_returns_413`, `test_upload_rejects_non_image`.
4. **Sessão expirada no meio do cadastro** — toast "Sessão expirada, entre novamente", não "Não foi possível salvar". Teste: Task 17 `apiErrorMessage` com 401.
5. **Filtro de ano invertido** (`year_from > year_to`) — 200 com lista vazia e estado vazio na UI, nunca 500. Teste: Task 4 `test_public_list_inverted_year_range_is_empty`.

---

## Execução — roteamento de modelos (subagent-driven)

Cada task = 1 implementador + 1 revisor, contexto novo. O implementador recebe só: Decisões, Global Constraints, a própria task e o bloco Interfaces das tasks de que depende. Nunca o plano inteiro.

| Papel | Modelo | Tasks |
|---|---|---|
| Implementador — mecânico/limpeza | `haiku` | 1, 18 |
| Implementador — padrão | `sonnet` | 2, 3, 5, 6, 7, 8, 10, 11, 12, 13, 15, 16, 17 |
| Implementador — crítico (vazamento de dados, validação central) | `opus` | 4, 14 |
| Revisor de spec por task (checa testes e requisitos) | `haiku` | todas |
| Revisor de qualidade por task | `sonnet` | 4, 5, 6, 11, 12, 14 |
| Revisão final da branch | `opus` | — |

Regras: falha no revisor → corrige o mesmo implementador (via SendMessage); 2 falhas seguidas → sobe um nível de modelo. Task 9 concluída (D6).

## Pré-voo

- [x] WIP commitado pelo dono (`d12a9ac update: auth`).
- [ ] Postgres de pé: `docker compose -f backend/docker-compose.yml up -d`; `cd backend && venv/Scripts/alembic upgrade head`.

---

## FASE 1 — Backend: base de testes, segurança e dados

### Task 1: Harness de testes do backend

**Files:**
- Create: `backend/requirements-dev.txt` (`-r requirements.txt`, `pytest>=8,<9`, `httpx>=0.27,<0.28`)
- Create: `backend/tests/__init__.py`, `backend/tests/conftest.py`, `backend/tests/test_health.py`
- Create: `backend/pytest.ini` (`[pytest]` / `testpaths = tests`)

**Interfaces:**
- Produces (fixtures em `conftest.py`):
  - `db() -> Session` — SQLite `sqlite://` com `StaticPool`, `check_same_thread=False`, `Base.metadata.create_all`; tabelas limpas por teste.
  - `client(db) -> TestClient` — `app.dependency_overrides[get_db]` devolvendo a mesma sessão.
  - `user(db) -> User` — `owner@test.com`, `is_admin=True`, senha `"secret123"` via `hash_password`.
  - `auth_headers(user) -> dict[str, str]` — `{"Authorization": f"Bearer {create_access_token(user.id)}"}`.
  - `make_coin(db, user) -> Callable[..., Coin]` — cria `Coin` com defaults (`title="Moeda teste"`, `year=1994`, `country="Brasil"`, `face_value="1 Real"`, `quantity=1`) e aplica `**overrides`.
  - `media_dir(tmp_path, monkeypatch) -> Path` — aponta `routers.coins.MEDIA_DIR` para `tmp_path/"coins"`.
- `conftest.py` define `os.environ` **antes** de importar `main`: `DATABASE_URL="sqlite://"`, `JWT_SECRET_KEY="test"`, `MFA_SECRET_KEY=Fernet.generate_key().decode()`.

- [ ] **Step 1: Escrever o teste**

```python
def test_health(client):
    r = client.get("/")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"
```

- [ ] **Step 2:** `venv/Scripts/pip install -r requirements-dev.txt`
- [ ] **Step 3:** Implementar `conftest.py` conforme Interfaces.
- [ ] **Step 4:** `venv/Scripts/python -m pytest -q` → `1 passed`
- [ ] **Step 5:** Commit `test: add backend pytest harness`

### Task 2: Guardas de autenticação e registro fechado

Hoje `get_current_user` devolve `None` sem token; `create_coin`, `update_coin`, `delete_coin`, upload, import, export, `/dashboard/summary` e `get_admin_user` acessam `current_user.id` → **500** em vez de 401. `/auth/register` é aberto a qualquer um.

**Files:**
- Modify: `backend/routers/coins.py` (todas as rotas de escrita + `list_coins` + export → `Depends(get_current_active_user)`)
- Modify: `backend/routers/dashboard.py`, `backend/routers/audit_logs.py:20` (`get_admin_user` passa a depender de `get_current_active_user`)
- Modify: `backend/core/config.py` (`ALLOW_REGISTRATION: bool = False`)
- Modify: `backend/routers/auth.py:75` (register → 403 `"Registration is disabled."` quando flag falsa)
- Test: `backend/tests/test_auth_guards.py`

> Efeito colateral esperado: a galeria pública (`Index.tsx`, chama `/coins` sem token) fica sem dados até a Task 11 migrá-la para `/public/coins`.

- [ ] **Step 1: Testes**

```python
import pytest

@pytest.mark.parametrize("method,path", [
    ("post", "/api/v1/coins"),
    ("get", "/api/v1/coins"),
    ("delete", "/api/v1/coins/1"),
    ("get", "/api/v1/dashboard/summary"),
    ("get", "/api/v1/admin/audit-logs"),
    ("get", "/api/v1/coins/export/all"),
])
def test_requires_auth(client, method, path):
    assert getattr(client, method)(path).status_code == 401

def test_register_disabled_by_default(client):
    r = client.post("/api/v1/auth/register", json={"email": "x@y.com", "password": "abcdefgh1"})
    assert r.status_code == 403
```

- [ ] **Step 2:** Rodar → falha (500 / 201).
- [ ] **Step 3:** Trocar dependências; adicionar flag.
- [ ] **Step 4:** pytest verde.
- [ ] **Step 5:** Commit `fix: require auth on private endpoints and gate registration`

### Task 3: Campos de catálogo e de venda (migration)

**Files:**
- Modify: `backend/models/coin.py` — novas colunas, todas `nullable`:
  `for_sale: Mapped[bool] = mapped_column(default=False, server_default=sa.false(), index=True)`,
  `sale_price: float | None`, `public_description: str | None (Text)`,
  `catalog_ref: str | None (String(50), index)`, `material: str | None (String(100))`,
  `diameter_mm: float | None`, `weight_g: float | None`, `mint_mark: str | None (String(50))`
- Modify: `backend/schemas/coin.py` — os mesmos campos em `CoinBase` e `CoinUpdate` (`sale_price`, `diameter_mm`, `weight_g` com `ge=0`; `year` passa a `le=datetime.now().year + 1`)
- Create: `backend/alembic/versions/<rev>_add_catalog_and_sale_fields.py`
- Modify: `frontend/src/lib/api.ts` — campos em `Coin` e `CoinCreate`
- Test: `backend/tests/test_coins_crud.py`

- [ ] **Step 1: Testes**

```python
def test_create_coin_with_catalog_fields(client, auth_headers):
    body = {"title": "1 Real", "year": 1994, "country": "Brasil", "face_value": "1 Real",
            "catalog_ref": "KM# 652", "material": "Aço inox", "diameter_mm": 24.0,
            "weight_g": 4.27, "for_sale": True, "sale_price": 30}
    r = client.post("/api/v1/coins", json=body, headers=auth_headers)
    assert r.status_code == 201
    assert r.json()["catalog_ref"] == "KM# 652"
    assert r.json()["for_sale"] is True

def test_year_in_future_rejected(client, auth_headers):
    body = {"title": "x", "year": 3000, "country": "Brasil", "face_value": "1"}
    assert client.post("/api/v1/coins", json=body, headers=auth_headers).status_code == 422
```

- [ ] **Step 2:** Rodar → falha.
- [ ] **Step 3:** Model + schemas + `alembic revision --autogenerate -m "add catalog and sale fields"`; revisar o arquivo gerado (só `add_column`/`create_index`).
- [ ] **Step 4:** pytest verde; `venv/Scripts/alembic upgrade head` no Postgres local sem erro; `alembic downgrade -1 && alembic upgrade head` OK.
- [ ] **Step 5:** Commit `feat: add catalog and sale fields to coin`

### Task 4: API pública separada

`GET /coins` e `GET /coins/{id}` hoje servem público e admin com o mesmo schema completo (vaza D2). Separar.

**Files:**
- Create: `backend/routers/public.py` (`APIRouter(prefix="/public", tags=["public"])`), registrar em `main.py`
- Modify: `backend/schemas/coin.py` — `CoinPublic(BaseModelWithOrm)` com: `id, title, quantity, year, country, face_value, originality, condition, category, catalog_ref, material, diameter_mm, weight_g, mint_mark, for_sale, sale_price, public_description, image_url_front, image_url_back`. `sale_price` só é preenchido quando `for_sale` (validator `model_validator(mode="after")` zera caso contrário).
- Modify: `backend/routers/coins.py` — `GET /coins/{id}` passa a usar `get_coin_or_404(db, id, user.id)` + auth; `list_coins` ganha filtros `category: str | None`, `for_sale: bool | None`, `sort: Literal["year_desc","year_asc","created_desc","title_asc"] = "created_desc"`; `search` também procura em `catalog_ref`.
- Test: `backend/tests/test_public_api.py`

**Interfaces:**
- Produces:
  - `GET /api/v1/public/coins` → `PaginatedResponse[CoinPublic]`; query: `page, page_size (≤48), search, country, category, year_from, year_to, originality, for_sale, sort`
  - `GET /api/v1/public/coins/{id}` → `CoinPublic` | 404
  - `GET /api/v1/public/facets` → `{"countries": list[str], "categories": list[str], "year_min": int | None, "year_max": int | None}` (ordenados, distintos, sem nulos)
- A lógica de filtro é compartilhada: extrair `apply_coin_filters(query: Select, **filters) -> Select` em `backend/repositories/coin_repo.py` e usar nas duas rotas.

- [ ] **Step 1: Testes**

```python
PRIVATE = {"purchase_price", "estimated_value", "storage_location",
           "acquisition_source", "acquisition_date", "notes", "owner_id"}

def test_public_detail_hides_private_fields(client, make_coin):
    c = make_coin(purchase_price=10, storage_location="Cofre", notes="segredo")
    data = client.get(f"/api/v1/public/coins/{c.id}").json()
    assert PRIVATE.isdisjoint(data)

def test_private_detail_requires_auth(client, make_coin):
    c = make_coin()
    assert client.get(f"/api/v1/coins/{c.id}").status_code == 401

def test_sale_price_hidden_when_not_for_sale(client, make_coin):
    c = make_coin(for_sale=False, sale_price=99)
    assert client.get(f"/api/v1/public/coins/{c.id}").json()["sale_price"] is None

def test_public_list_inverted_year_range_is_empty(client, make_coin):
    make_coin(year=1990)
    r = client.get("/api/v1/public/coins", params={"year_from": 2000, "year_to": 1980})
    assert r.status_code == 200 and r.json()["data"] == []

def test_facets(client, make_coin):
    make_coin(country="Portugal", year=1889); make_coin(country="Brasil", year=1994, category="Comemorativa")
    assert client.get("/api/v1/public/facets").json() == {
        "countries": ["Brasil", "Portugal"], "categories": ["Comemorativa"],
        "year_min": 1889, "year_max": 1994}

def test_filter_for_sale(client, make_coin):
    make_coin(for_sale=True); make_coin(for_sale=False)
    assert client.get("/api/v1/public/coins", params={"for_sale": True}).json()["meta"]["total_items"] == 1
```

- [ ] **Step 2:** Rodar → falha.
- [ ] **Step 3:** Implementar router, schema, `apply_coin_filters`.
- [ ] **Step 4:** pytest verde.
- [ ] **Step 5:** Commit `feat: split public coin API with private-field filtering`

### Task 5: Upload de imagens endurecido

Hoje aceita qualquer arquivo (um `.html` enviado vira XSS servido em `/media`), sem limite de tamanho, extensão vem do nome do arquivo, arquivos antigos ficam órfãos.

**Files:**
- Modify: `backend/routers/coins.py` (`upload_coin_image`, `delete_coin`)
- Modify: `backend/core/storage.py` — `save_image(file: UploadFile, media_dir: str) -> str` e `delete_media(path: str | None) -> None` (ignora `None` e arquivos inexistentes; só apaga dentro de `media/`)
- Test: `backend/tests/test_uploads.py`

**Interfaces:**
- `ALLOWED_IMAGE_TYPES = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}`; `MAX_IMAGE_BYTES = 10 * 1024 * 1024`
- Tipo inválido → 415 `"Formato não suportado. Use JPG, PNG ou WEBP."`; tamanho → 413 `"Imagem maior que 10 MB."`
- Substituir imagem apaga a anterior; `delete_coin` apaga as duas.

- [ ] **Step 1: Testes** (usam fixture `media_dir`)

```python
def test_upload_rejects_non_image(client, auth_headers, make_coin, media_dir):
    c = make_coin()
    r = client.post(f"/api/v1/coins/{c.id}/upload-images", headers=auth_headers,
                    files={"front_image": ("x.html", b"<script>", "text/html")})
    assert r.status_code == 415

def test_upload_too_large_returns_413(client, auth_headers, make_coin, media_dir):
    c = make_coin()
    big = b"\xff\xd8" + b"0" * (10 * 1024 * 1024 + 1)
    r = client.post(f"/api/v1/coins/{c.id}/upload-images", headers=auth_headers,
                    files={"front_image": ("a.jpg", big, "image/jpeg")})
    assert r.status_code == 413

def test_replace_deletes_old_file(client, auth_headers, make_coin, media_dir):
    c = make_coin()
    url = lambda: client.get(f"/api/v1/coins/{c.id}", headers=auth_headers).json()["image_url_front"]
    client.post(f"/api/v1/coins/{c.id}/upload-images", headers=auth_headers, files={"front_image": ("a.png", b"1", "image/png")})
    old = url()
    client.post(f"/api/v1/coins/{c.id}/upload-images", headers=auth_headers, files={"front_image": ("b.png", b"2", "image/png")})
    assert not (media_dir / old.rsplit("/", 1)[-1]).exists()
    assert url().endswith(".png") and url() != old
```

- [ ] **Step 2:** Rodar → falha.
- [ ] **Step 3:** Implementar; ler o arquivo em blocos e abortar ao passar do limite.
- [ ] **Step 4:** pytest verde.
- [ ] **Step 5:** Commit `fix: validate and clean up coin image uploads`

### Task 6: Importação/exportação utilizáveis

**Files:**
- Modify: `backend/routers/coins.py` (`import_from_file`, `export_to_file`)
- Test: `backend/tests/test_import_export.py`

**Interfaces:**
- `POST /coins/import` → `{"inserted": int, "errors": [{"row": int, "message": str}]}` (`row` 1-based, linha de dados). Linhas válidas são inseridas mesmo com erros em outras.
- CSV: decodificar `utf-8-sig`; detectar delimitador pela linha de cabeçalho (`;` se houver mais `;` que `,`); células vazias → `None` antes do `CoinCreate`; decimais aceitam vírgula (`"10,50"` → `10.5`).
- Export CSV: `utf-8-sig`, delimitador `;`, nome `colecao-YYYY-MM-DD.csv`; inclui os campos da Task 3. Export JSON com `Content-Disposition` também.
- Template: `GET /coins/import/template` → CSV só com cabeçalho na ordem das colunas de `CoinCreate`.

- [ ] **Step 1: Testes**

```python
def test_import_csv_semicolon_with_bom(client, auth_headers):
    csv = "﻿title;year;country;face_value;purchase_price\n1 Real;1994;Brasil;1 Real;10,50\n".encode("utf-8")
    r = client.post("/api/v1/coins/import", headers=auth_headers, files={"file": ("c.csv", csv, "text/csv")})
    assert r.json() == {"inserted": 1, "errors": []}

def test_import_reports_bad_rows(client, auth_headers):
    csv = b"title,year,country,face_value\nok,1994,Brasil,1\nbad,abc,Brasil,1\n"
    r = client.post("/api/v1/coins/import", headers=auth_headers, files={"file": ("c.csv", csv, "text/csv")})
    assert r.json()["inserted"] == 1
    assert r.json()["errors"][0]["row"] == 2

def test_export_roundtrip(client, auth_headers, make_coin):
    make_coin(title="Réis", catalog_ref="KM# 1")
    out = client.get("/api/v1/coins/export/all", params={"format": "csv"}, headers=auth_headers).content
    r = client.post("/api/v1/coins/import", headers=auth_headers, files={"file": ("e.csv", out, "text/csv")})
    assert r.json()["errors"] == []
```

- [ ] **Step 2:** Rodar → falha.
- [ ] **Step 3:** Implementar. Import ignora colunas `id, owner_id, created_at, updated_at, image_url_*` vindas do export.
- [ ] **Step 4:** pytest verde.
- [ ] **Step 5:** Commit `feat: robust CSV import with row errors and Excel-friendly export`

### Task 7: Dashboard com números corretos

Hoje `total_coins` conta registros (ignora `quantity`) e `total_estimated_value` soma sem multiplicar por `quantity`.

**Files:**
- Modify: `backend/routers/dashboard.py`
- Modify: `frontend/src/lib/api.ts` (`DashboardSummary`)
- Test: `backend/tests/test_dashboard.py`

**Interfaces:**
- Produces: resposta com `total_items` (registros), `total_pieces` (soma de `quantity`), `total_countries`, `total_originals`, `total_replicas`, `total_for_sale`, `total_estimated_value` (Σ `estimated_value*quantity`), `total_invested` (Σ `purchase_price*quantity`), `by_country`, `by_year`, `by_originality`, `by_category`, `recent: list[CoinRead]` (5 últimas por `created_at`). Remove `total_coins`.

- [ ] **Step 1: Teste**

```python
def test_summary_multiplies_quantity(client, auth_headers, make_coin):
    make_coin(quantity=3, estimated_value=10, purchase_price=2)
    make_coin(quantity=1, estimated_value=5, for_sale=True)
    s = client.get("/api/v1/dashboard/summary", headers=auth_headers).json()
    assert (s["total_items"], s["total_pieces"]) == (2, 4)
    assert s["total_estimated_value"] == 35
    assert s["total_invested"] == 6
    assert s["total_for_sale"] == 1
```

- [ ] **Step 2–4:** falha → implementar → verde.
- [ ] **Step 5:** Commit `fix: dashboard totals account for quantity`

---

## FASE 2 — Frontend: base

### Task 8: Fundação do frontend

**Files:**
- Modify: `frontend/package.json` (devDep `vitest`; script `"test": "vitest run"`)
- Create: `frontend/src/lib/coin-format.ts`, `frontend/src/lib/coin-format.test.ts`
- Create: `frontend/src/lib/brand.ts` (`export const BRAND_NAME = "Santos Numismática"`)
- Create: `frontend/.env.example` (`VITE_API_URL`, `VITE_CONTACT_WHATSAPP`, `VITE_CONTACT_EMAIL`)
- Modify: `frontend/src/lib/api.ts` (`API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000"`; `publicApi` com `list`, `get`, `facets` da Task 4; `coinsApi` ganha `importFile`, `exportFile`, `template`)
- Modify: `frontend/index.html` (`lang="pt-BR"`, `<title>`, `meta description`, remover TODOs)
- Modify: remover cópias locais de `originalityLabel`, `originalityBadgeClasses`, `formatCurrencyBRL`, `resolveImageUrl`/`safeImageUrl`, `normalizeOriginality` em `Index.tsx`, `CoinDetail.tsx`, `CoinCard.tsx`, `CoinsList.tsx`, `CoinForm.tsx` → importar de `coin-format.ts`
- Modify: `frontend/src/pages/Index.tsx` — corrigir os 2 erros de `tsc` e **remover o fallback de dados de demonstração** (erro mostra erro, não moedas falsas)

**Interfaces:**
- Produces (`coin-format.ts`):
  - `type Originality = "original" | "replica" | "unknown"`
  - `ORIGINALITY_OPTIONS: { value: Originality; label: string }[]` — `Original`, `Réplica`, `Desconhecida`
  - `originalityLabel(v: string | null | undefined): string`
  - `formatBRL(v: number | null | undefined): string` — `null/undefined` → `"—"`
  - `resolveImageUrl(path: string | null | undefined): string | null`
  - `CONDITION_OPTIONS: string[]` — `["FC (Flor de Cunho)", "SOB (Soberba)", "MBC (Muito Bem Conservada)", "BC (Bem Conservada)", "R (Regular)", "UTG (Um Tanto Gasta)"]`

- [ ] **Step 1: Testes** (`coin-format.test.ts`)

```ts
import { describe, expect, it } from "vitest"
import { formatBRL, originalityLabel, resolveImageUrl } from "./coin-format"

describe("coin-format", () => {
  it("formata BRL", () => expect(formatBRL(1234.5)).toBe("R$ 1.234,50"))
  it("nulo vira traço", () => expect(formatBRL(null)).toBe("—"))
  it("rótulo de originalidade", () => expect(originalityLabel("REPLICA")).toBe("Réplica"))
  it("caminho relativo vira absoluto", () =>
    expect(resolveImageUrl("media/coins/a.jpg")).toBe("http://localhost:8000/media/coins/a.jpg"))
  it("vazio ou 'string' vira null", () => {
    expect(resolveImageUrl("")).toBeNull()
    expect(resolveImageUrl("string")).toBeNull()
  })
})
```

- [ ] **Step 2:** `npm i -D vitest && npm test` → falha.
- [ ] **Step 3:** Implementar e trocar os usos.
- [ ] **Step 4:** `npm test` verde; `npx tsc -p tsconfig.app.json --noEmit` sem erro; `npm run build` OK.
- [ ] **Step 5:** Commit `refactor: centralize coin formatting helpers and env config`

---

## FASE 3 — Direção visual

### Task 9: Três versões de design para o dono escolher

**Deliverable:** um Artifact HTML com as três direções lado a lado (abas), cada uma mostrando as mesmas 3 telas: **card da galeria**, **detalhe da moeda (à venda)**, **formulário de cadastro (mobile 375px)**. Usar 3 moedas reais do banco (título, país, ano, foto se houver). Após a escolha, registrar em **D6**.

| | A — Gabinete Clássico | B — Catálogo de Museu | C — Cofre Noturno |
|---|---|---|---|
| Ideia | Evolução do atual, polido | Editorial, impresso, sóbrio | Escuro, metálico, foto em destaque |
| Fundo | creme `#F7F4EC` | papel `#FBFAF7` | quase preto `#0E0F12` |
| Texto | grafite `#1F2430` | tinta `#16161A` | marfim `#EDE8DC` |
| Acento | ouro `#C9A227` | vermelho lacre `#8C2F28` + ouro só em preço | ouro velho `#B8913A` / bronze `#8A5A2B` |
| Display | Fraunces 600 | Cormorant Garamond 500, versalete em rótulos | Inter Tight 600, tracking apertado |
| Corpo | Inter | Inter | Inter |
| Card | foto quadrada, borda fina, sombra suave | foto em círculo sobre fundo neutro, sem borda, nº de catálogo em versalete | foto em fundo escuro com vinheta, frente↔verso no hover |
| Detalhe | grid 2 colunas, ficha em cards | uma coluna estreita tipo ficha de museu, metadados em tabela tipográfica | foto grande de borda a borda, ficha flutuante |
| Admin | sidebar grafite | sidebar clara, bordas finas | tudo escuro |

- [ ] **Step 1:** Carregar skill `artifact-design`; montar o HTML com tokens de cada versão como CSS custom properties.
- [ ] **Step 2:** Publicar o Artifact; enviar link ao dono.
- [ ] **Step 3:** Dono escolhe (pode misturar, ex. "B com cards de C"). Registrar em D6 os tokens finais: cores (HSL), fontes, raio, sombra.
- [ ] **Step 4:** Commit do plano atualizado `docs: record chosen visual direction`

### Task 10: Aplicar tokens da direção escolhida

**Files:**
- Modify: `frontend/src/index.css` (variáveis `:root` e `.dark`; `@import` do Google Fonts escolhido; remover fontes não usadas)
- Modify: `frontend/tailwind.config.ts` (`fontFamily.display`/`body`; trocar `require("tailwindcss-animate")` por `import`)
- Modify: `frontend/public/favicon.svg` (moeda no acento escolhido)
- Modify: `frontend/src/components/ui/button.tsx` (variante `gold` → `accent` alinhada ao token; manter alias `gold` até a Task 17)

- [ ] **Step 1:** Aplicar tokens de D6.
- [ ] **Step 2:** `npm run build` OK; abrir `/`, `/admin/dashboard`, `/admin/coins/new` e conferir contraste AA (texto ≥ 4.5:1) no DevTools.
- [ ] **Step 3:** Commit `style: apply chosen visual direction tokens`

---

## FASE 4 — Telas

### Task 11: Galeria pública

**Files:**
- Modify: `frontend/src/pages/Index.tsx`, `frontend/src/components/coins/CoinFilters.tsx`, `frontend/src/components/coins/CoinCard.tsx`, `frontend/src/components/layout/PublicHeader.tsx`
- Create: `frontend/src/components/layout/PublicFooter.tsx` (`© {ano atual} {BRAND_NAME}`, link discreto "Área do colecionador" → `/admin/login`)

**Requisitos:**
- Dados via `useQuery` + `publicApi.list` / `publicApi.facets`; filtros vivem na URL (`useSearchParams`) — link compartilhável e voltar do detalhe preserva filtros.
- Filtros: busca, país (facets), categoria (facets), ano de/até (placeholder com `year_min`/`year_max`), originalidade com valores `original|replica|unknown` (corrige o bug atual "Original/Réplica/Restaurada"), toggle "Só à venda", ordenação.
- Contador "N moedas" correto (`meta.total_items`); paginação mantém página na URL.
- Card: foto frente (verso no hover quando existir), placeholder quando sem foto ou quando a imagem falha (estado em React, não `src=""`), título, país • ano • valor de face, badge "À venda" + `formatBRL(sale_price)` quando `for_sale`. Remover "N disponível" de peças não à venda.
- Estados: skeleton de cards no loading; erro com botão "Tentar novamente"; vazio com "Limpar filtros".
- Hero menor (a coleção é o conteúdo); header com `BRAND_NAME`.

- [ ] **Step 1:** Implementar.
- [ ] **Step 2:** `tsc` + `build` OK. No navegador (375 / 768 / 1280px): filtrar por país, abrir detalhe, voltar → filtro mantido; desligar backend → estado de erro, sem moedas falsas.
- [ ] **Step 3:** Commit `feat: rebuild public gallery on public API`

### Task 12: Detalhe público com contato de venda

**Files:**
- Modify: `frontend/src/pages/CoinDetail.tsx` (reescrita; corrigir indentação quebrada atual)
- Create: `frontend/src/lib/contact.ts`, `frontend/src/lib/contact.test.ts`

**Interfaces:**
- `buildContactLinks(coin: { title: string; id: number }, pageUrl: string, env?: { whatsapp?: string; email?: string }): { whatsapp: string | null; email: string | null }` — `env` default lê `import.meta.env`.

**Requisitos:**
- Usa `publicApi.get`; 404 → página "Moeda não encontrada" com link para a galeria.
- Galeria frente/verso com miniaturas; clicar na foto abre `Dialog` com imagem em tamanho real.
- Ficha: país, ano, valor de face, catálogo, material, diâmetro (mm), peso (g), marca de casa da moeda, condição, categoria, originalidade — linhas sem valor não aparecem.
- `public_description` como texto livre.
- Bloco de venda **só se `for_sale`**: preço, botão WhatsApp e botão e-mail (o que estiver configurado). Sem nenhum configurado → só o preço. Remover "Informações para compra", "Valor estimado", datas de cadastro.
- `<title>` da aba = `"{title} — {BRAND_NAME}"`.

- [ ] **Step 1: Testes**

```ts
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
```

- [ ] **Step 2:** `npm test` → falha.
- [ ] **Step 3:** Implementar `contact.ts` e a página.
- [ ] **Step 4:** `npm test` verde; navegador: moeda à venda mostra botões; não à venda não mostra; DevTools Network confirma que a resposta não tem campos de D2.
- [ ] **Step 5:** Commit `feat: public coin detail with sale contact`

### Task 13: Shell do admin responsivo + code splitting

**Files:**
- Modify: `frontend/src/components/layout/AdminLayout.tsx`, `frontend/src/components/layout/AdminSidebar.tsx`
- Modify: `frontend/src/App.tsx` (rotas `/admin/*` via `React.lazy` + `Suspense`)

**Requisitos:**
- `≥ lg`: sidebar fixa como hoje. `< lg`: topbar com botão menu abrindo `Sheet` (já existe em `components/ui/sheet.tsx`) com a mesma navegação; `main` sem `ml-64`.
- Item ativo usa `pathname.startsWith(href)` (hoje "Gerenciar Moedas" apaga ao editar). "Adicionar Moeda" ativo só em `/admin/coins/new`.
- Link "Ver galeria" (abre `/` em nova aba). Marca = `BRAND_NAME`.
- Bundle público não carrega `recharts`: `npm run build` → chunk principal < 500 kB (hoje 966 kB).

- [ ] **Step 1:** Implementar.
- [ ] **Step 2:** `build` sem aviso de chunk > 500 kB; navegador em 375px: menu abre/fecha, navegação funciona.
- [ ] **Step 3:** Commit `feat: responsive admin shell and lazy admin routes`

### Task 14: Formulário de cadastro otimizado para catalogar

**Files:**
- Create: `frontend/src/lib/coin-schema.ts`, `frontend/src/lib/coin-schema.test.ts`
- Modify: `frontend/src/pages/admin/CoinForm.tsx` (reescrita com `react-hook-form` + `zodResolver` + `components/ui/form.tsx`)

**Interfaces:**
- `coinFormSchema` (zod) e `type CoinFormValues = z.infer<typeof coinFormSchema>`
- `toCoinPayload(values: CoinFormValues): CoinCreate` — strings vazias → `null`
- `coinToFormValues(coin: Coin): CoinFormValues`
- Regras: `title`, `country`, `face_value` obrigatórios (trim); `year` inteiro 1–(ano atual + 1); `quantity` inteiro ≥ 1; números (`purchase_price`, `estimated_value`, `sale_price`, `diameter_mm`, `weight_g`) aceitam `"10,50"` e `"10.50"`, vazio → `null`, ≥ 0; `sale_price` obrigatório quando `for_sale`.

**Requisitos de UI:**
- Seções: Fotos · Identificação (título, país, ano, valor de face, catálogo, quantidade) · Características (material, diâmetro, peso, marca, condição, originalidade, categoria) · Aquisição — privado (preço de compra, valor estimado, origem, data, local de armazenamento, notas) · Vitrine (à venda, preço de venda, descrição pública). Seção privada com selo "Visível só para você".
- Fotos: `<input type="file" accept="image/jpeg,image/png,image/webp" capture="environment">` (câmera traseira no celular); preview; botão remover.
- País e categoria: `<datalist>` com `publicApi.facets`; condição: `<datalist>` com `CONDITION_OPTIONS`.
- Data de aquisição: `type="date"` (não `datetime-local`).
- Números com `inputMode="decimal"` e `type="text"` (aceita vírgula).
- Erros por campo (`FormMessage`), não toast genérico. Erro de API mostra `apiErrorMessage` (Task 17; até lá, `detail` da resposta).
- Botões: **Salvar** e **Salvar e adicionar outra** (só em criação) — o segundo limpa o form mantendo `country`, `category`, `material`, `acquisition_source`, `storage_location`, `for_sale` e foca o título.
- Se a moeda salvar mas o upload falhar: toast "Moeda salva, mas a foto não foi enviada: {motivo}" e navega para a edição dela.

- [ ] **Step 1: Testes** (`coin-schema.test.ts`)

```ts
import { expect, it } from "vitest"
import { coinFormSchema, toCoinPayload } from "./coin-schema"

const base = { title: "1 Real", country: "Brasil", year: "1994", face_value: "1 Real", quantity: "1",
  originality: "original", for_sale: false }

it("aceita vírgula decimal", () => {
  const v = coinFormSchema.parse({ ...base, purchase_price: "10,50", weight_g: "4,27" })
  expect([v.purchase_price, v.weight_g]).toEqual([10.5, 4.27])
})
it("vazio vira null no payload", () =>
  expect(toCoinPayload(coinFormSchema.parse({ ...base, category: "", purchase_price: "" })))
    .toMatchObject({ category: null, purchase_price: null }))
it("ano futuro é inválido", () =>
  expect(coinFormSchema.safeParse({ ...base, year: String(new Date().getFullYear() + 2) }).success).toBe(false))
it("à venda exige preço", () =>
  expect(coinFormSchema.safeParse({ ...base, for_sale: true, sale_price: "" }).success).toBe(false))
it("quantidade zero é inválida", () =>
  expect(coinFormSchema.safeParse({ ...base, quantity: "0" }).success).toBe(false))
```

- [ ] **Step 2:** `npm test` → falha.
- [ ] **Step 3:** Implementar schema e reescrever `CoinForm.tsx`.
- [ ] **Step 4:** `npm test` verde; navegador em 375px: cadastrar 3 moedas seguidas com "Salvar e adicionar outra", com foto, digitando "10,50"; editar uma e trocar foto.
- [ ] **Step 5:** Commit `feat: catalog-optimized coin form with validation`

### Task 15: Lista de moedas do admin

**Files:**
- Modify: `frontend/src/pages/admin/CoinsList.tsx`
- Create: `frontend/src/components/coins/ImportDialog.tsx`

**Requisitos:**
- `useQuery` + filtros na URL: busca, originalidade, categoria, à venda, ordenação.
- Colunas: miniatura, título, catálogo, país, ano, valor de face, qtd., originalidade, à venda (preço). Remover coluna "Notas".
- `< md`: lista em cards (miniatura + título + país/ano + ações), não tabela com scroll lateral.
- Ações por linha: ver na galeria, editar, **duplicar** (abre `/admin/coins/new?from={id}` com campos copiados, sem fotos), excluir (diálogo existente).
- Toolbar: "Importar" (abre `ImportDialog`: escolher arquivo, baixar template, ao fim mostrar `inserted` e tabela de `errors` por linha), "Exportar CSV", "Exportar JSON".
- Remover `console.log` (linha 80).
- Excluir o último item de uma página volta para a anterior.

- [ ] **Step 1:** Implementar (`CoinForm` lê `?from=` com `coinsApi.get` + `coinToFormValues`, limpando imagens).
- [ ] **Step 2:** `tsc` + `build`. Navegador: importar o CSV de teste com 1 linha ruim → mostra 1 erro com número da linha; exportar e abrir no Excel → colunas separadas e acentos corretos; duplicar uma moeda.
- [ ] **Step 3:** Commit `feat: admin coin list with import, export and duplicate`

### Task 16: Dashboard

**Files:**
- Modify: `frontend/src/pages/admin/Dashboard.tsx`

**Requisitos:**
- KPIs: Peças (`total_pieces`, subtítulo `total_items` registros), Países, Valor estimado, Investido, À venda.
- Gráficos (recharts, já instalado): por país (top 10 + "Outros"), por década (agrupar `by_year` no frontend), por originalidade, por categoria. Cores dos tokens de D6.
- Lista "Adicionadas recentemente" (`recent`) com link para edição.
- Coleção vazia → estado vazio com CTA "Cadastrar primeira moeda" e "Importar planilha", sem gráficos vazios.

- [ ] **Step 1:** Implementar.
- [ ] **Step 2:** `build`; navegador com banco vazio e com dados.
- [ ] **Step 3:** Commit `feat: dashboard with corrected KPIs and empty state`

### Task 17: Login, Segurança, Auditoria e limpeza de lint

**Files:**
- Modify: `frontend/src/lib/api.ts` — `apiErrorMessage(err: unknown, fallback: string): string`; interceptor 401 redireciona para `/admin/login?next={pathname}` quando a rota atual é `/admin/*`
- Create: `frontend/src/lib/api.test.ts`
- Modify: `frontend/src/pages/admin/Login.tsx` (respeita `?next=`), `Security.tsx`, `AuditLogs.tsx`, `components/layout/AuditLogDetailsDialog.tsx`, `contexts/AuthContext.tsx` (tipar `user`)
- Modify: todos os arquivos com erro de `npm run lint`; remover alias `gold` do botão; apagar `src/App.css` e `components/NavLink.tsx` se não usados

**Interfaces:**
- `apiErrorMessage`: 401 → `"Sessão expirada. Entre novamente."`; 413/415/422/400 → `detail` da resposta (string; se for lista do Pydantic, junta `msg`); rede sem resposta → `"Servidor indisponível. Verifique a conexão."`; resto → `fallback`.

- [ ] **Step 1: Testes**

```ts
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
```

- [ ] **Step 2:** `npm test` → falha.
- [ ] **Step 3:** Implementar; trocar todos os `catch (err: any)` por `apiErrorMessage`; polir visual das 3 telas com os tokens de D6 (login centrado com marca, Segurança em cards, Auditoria com filtros e badge por ação).
- [ ] **Step 4:** `npm test` verde; `npm run lint` → **0 errors**; `tsc` e `build` OK.
- [ ] **Step 5:** Commit `fix: unified API error handling and lint cleanup`

---

## FASE 5 — Fechamento

### Task 18: QA final e documentação de operação

**Files:**
- Create: `README.md` (raiz) — como subir (Postgres, migrations, backend, frontend), variáveis de ambiente, **backup** (`pg_dump` do banco + cópia de `backend/media/`) e restauração
- Modify: `backend/.gitignore` (linha `config.py  # If...` é um padrão literal inválido; remover)
- Modify: `backend/main.py` — CORS: usar `settings.BACKEND_CORS_ORIGINS` em `allow_origins` (hoje é `"*"` com `allow_credentials=True`)
- Delete: `backend/README` (vazio)

- [ ] **Step 1:** Rodar todos os gates: `pytest -q`, `npm test`, `npx tsc -p tsconfig.app.json --noEmit`, `npm run lint`, `npm run build`.
- [ ] **Step 2:** Roteiro manual com Playwright/Chrome DevTools em 375, 768 e 1280 px; screenshot de cada tela anexado ao PR:
  1. Login (com e sem MFA) → dashboard vazio → "Cadastrar primeira moeda".
  2. Cadastrar 5 moedas pelo celular (375 px) com foto via "Salvar e adicionar outra".
  3. Importar CSV de 20 linhas exportado do Excel pt-BR.
  4. Marcar 2 como à venda → galeria pública (aba anônima): filtros, detalhe, botão WhatsApp abre `wa.me` com texto certo.
  5. Na aba anônima, `GET /api/v1/coins` → 401; `GET /api/v1/public/coins/{id}` sem campos de D2.
  6. Exportar CSV → abrir no Excel.
  7. Console do navegador sem erros em todas as telas.
- [ ] **Step 3:** Corrigir o que aparecer (cada correção com teste se for lógica).
- [ ] **Step 4:** Commit `docs: operations README and final hardening`; abrir PR `dev → main`.

---

## Fora do escopo (adicionar quando precisar)

- Busca sem acento ("Sao Tome" achar "São Tomé"): requer extensão `unaccent` no Postgres.
- Redimensionar fotos no navegador antes do upload: limite de 10 MB cobre fotos de celular atuais.
- Múltiplos usuários/coleções, carrinho/checkout, PWA offline.
