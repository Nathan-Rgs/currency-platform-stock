# Checklist de QA manual

Para o dono do sistema. Rode com backend e frontend no ar (veja o README). Marque cada item e anote o que fugir do esperado.

## Cenários principais (375, 768 e 1280 px)

- [ ] **1. Login e dashboard vazio.** Entrar em `/admin/login` sem MFA; repetir com MFA ativo (pede o código). Esperado: dashboard vazio com o botão "Cadastrar primeira moeda", que abre o formulário.
- [ ] **2. Cadastro pelo celular (375 px).** Cadastrar 5 moedas com foto usando "Salvar e adicionar outra". Esperado: cada moeda aparece na lista; o formulário limpa a cada salvamento; fotos aparecem.
- [ ] **3. Importar CSV de 20 linhas** exportado do Excel pt-BR. Esperado: 20 moedas importadas, sem erro, com acentos corretos.
- [ ] **4. Galeria pública.** Marcar 2 moedas como à venda. Em aba anônima: todas as moedas aparecem e só as 2 à venda mostram preço e botões de contato; filtros funcionam; o detalhe abre; o botão WhatsApp abre `wa.me/<número>` com o texto correto da moeda.
- [ ] **5. Privacidade da API.** Em aba anônima, `GET /api/v1/coins` retorna 401; `GET /api/v1/public/coins/{id}` não traz campos internos (os "D2": dados privados da coleção).
- [ ] **6. Exportar CSV** e abrir no Excel. Esperado: acentos corretos, colunas separadas e com os títulos certos.
- [ ] **7. Console do navegador** sem erros em todas as telas.

## Larguras de tela (375 / 768 / 1280 px)

Sem rolagem horizontal, textos legíveis, botões clicáveis:

- [ ] Galeria pública
- [ ] Detalhe da moeda
- [ ] Lista de moedas do admin
- [ ] Formulário de moeda

## Outros itens

- [ ] Texto da mensagem do WhatsApp está correto: `Olá! Tenho interesse na moeda "{title}": {url}`.
- [ ] Planilha exportada abre no Excel com acentos e colunas corretos.
- [ ] Importar CSV salvo pelo Excel pt-BR: separador `;`, codificação cp1252, datas `dd/mm/yyyy` e linhas em branco no fim. Esperado: importa sem erro e ignora as linhas em branco.
- [ ] Migration no Postgres real (a `c3a1f0d27e44` só foi verificada offline). Em `backend/`: `alembic upgrade head`, depois `alembic downgrade -1`, depois `alembic upgrade head`. Esperado: os três comandos terminam sem erro.
- [ ] Primeira visita ao admin mostra o indicador de carregamento (spinner) e depois a tela, sem piscar o login.
- [ ] Sessão expirada: apagar/invalidar o token e navegar no admin. Esperado: redireciona para `/admin/login?next=...` e, após o login, volta para a página pedida.
