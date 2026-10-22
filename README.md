# Santos Numismática

Plataforma de gerenciamento de coleção de moedas: painel administrativo privado (cadastro, importação/exportação de planilhas, dashboard) e galeria pública das moedas à venda, com contato por WhatsApp.

- `backend/`: API FastAPI + PostgreSQL (SQLAlchemy, Alembic).
- `frontend/`: React + Vite + TypeScript.

## Requisitos

- Docker Desktop (para o PostgreSQL)
- Python 3.12
- Node.js (LTS) e npm

## Instalação passo a passo

### 1. Banco de dados

```bash
docker compose -f backend/docker-compose.yml up -d
```

Sobe o PostgreSQL 16 (container `currency_postgres`, usuário `currency_user`, banco `currency_db`, porta 5432).

### 2. Backend

```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate    |    Linux/macOS: source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env      # Windows: copy .env.example .env
```

Edite `backend/.env`:

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | Conexão com o Postgres. O valor do exemplo já funciona com o `docker-compose.yml`. |
| `JWT_SECRET_KEY` | Chave secreta dos tokens de login. Use um valor longo e aleatório. |
| `JWT_ALGORITHM` | `HS256` (padrão). |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Duração da sessão em minutos (ex.: `1440` = 24 h). |
| `MFA_SECRET_KEY` | Chave Fernet que cifra os segredos do MFA. Gere com o comando abaixo. |
| `ALLOW_REGISTRATION` | `false` por padrão: o cadastro de usuários fica fechado. Veja "Primeiro administrador". |
| `BACKEND_CORS_ORIGINS` | Lista JSON das origens do frontend permitidas, ex.: `["http://localhost:8080"]`. Sem barra final. Se vazia, o CORS fica desligado. |
| `BUCKET_NAME`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Presentes no exemplo, mas não usadas pelo código atual (as fotos ficam em `backend/media/`). |

Gerar `MFA_SECRET_KEY` e `JWT_SECRET_KEY`:

```bash
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

Aplicar as migrations:

```bash
alembic upgrade head
```

### 3. Primeiro administrador

O cadastro é fechado por padrão e o endpoint de registro sempre cria usuários com `is_admin=false`. Como o painel exige administrador, o processo é:

1. Em `backend/.env`, defina `ALLOW_REGISTRATION=true` e reinicie o backend.
2. Cadastre o usuário em `POST /api/v1/auth/register` (pela interface em http://localhost:8000/api/v1/docs), com `email`, `password` (mínimo 8 caracteres) e, opcionalmente, `display_name`.
3. Promova o usuário a administrador no banco:
   ```bash
   docker exec -it currency_postgres psql -U currency_user -d currency_db -c "UPDATE users SET is_admin = true WHERE email = 'seu@email.com';"
   ```
4. Volte `ALLOW_REGISTRATION=false` e reinicie o backend.

### 4. Rodar o backend

```bash
cd backend
uvicorn main:app --reload
```

API em http://localhost:8000 (documentação em `/api/v1/docs`). As fotos enviadas ficam em `backend/media/` e são servidas em `/media`.

### 5. Frontend

```bash
cd frontend
cp .env.example .env      # Windows: copy .env.example .env
npm install
npm run dev
```

Edite `frontend/.env`:

| Variável | Descrição |
|---|---|
| `VITE_API_URL` | URL do backend, ex.: `http://localhost:8000`. |
| `VITE_CONTACT_WHATSAPP` | Número do WhatsApp só com dígitos, com código do país (ex.: `5511999999999`). |
| `VITE_CONTACT_EMAIL` | E-mail de contato exibido no site. |

O frontend abre em http://localhost:8080 (esta origem já está no `BACKEND_CORS_ORIGINS` do exemplo). O painel fica em `/admin/login`.

## Testes e verificações

```bash
# backend (a partir de backend/, com o venv ativo)
pytest -q

# frontend (a partir de frontend/)
npm test
npx tsc -p tsconfig.app.json --noEmit
npm run lint
npm run build
```

O roteiro manual de QA está em [docs/QA-checklist.md](docs/QA-checklist.md).

## Backup e restauração

São dois itens e **os dois são necessários**: o banco (dados) e a pasta `backend/media/` (fotos).

Backup:

```bash
docker exec currency_postgres pg_dump -U currency_user -d currency_db -Fc > backup.dump
cp -r backend/media backup-media      # Windows: xcopy backend\media backup-media /E /I
```

Restauração (em um banco vazio, com o container rodando):

```bash
docker exec -i currency_postgres pg_restore -U currency_user -d currency_db --clean --if-exists < backup.dump
cp -r backup-media/. backend/media/   # Windows: xcopy backup-media backend\media /E /I /Y
```

Guarde as cópias fora do computador (nuvem ou HD externo) e teste a restauração de tempos em tempos. Guarde também o `backend/.env`: sem a mesma `MFA_SECRET_KEY`, o MFA dos usuários deixa de funcionar.

## Importação de planilhas

- No painel, baixe o modelo da planilha na tela de importação e preencha a partir dele.
- CSV do Excel pt-BR funciona: separador `;` e codificação cp1252 (padrão do "CSV (separado por vírgulas)" do Excel brasileiro) são aceitos, assim como UTF-8.
- Datas no formato `dd/mm/yyyy`.
- Valores numéricos sem separador de milhar (`1500,50`, e não `1.500,50`).
- Linhas em branco no fim da planilha são ignoradas.
