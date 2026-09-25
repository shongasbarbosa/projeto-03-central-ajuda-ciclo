# Central de Ajuda por Ciclo

[![CI](https://github.com/shongasbarbosa/projeto-03-central-ajuda-ciclo/actions/workflows/ci.yml/badge.svg)](https://github.com/shongasbarbosa/projeto-03-central-ajuda-ciclo/actions/workflows/ci.yml)
[![Deploy](https://github.com/shongasbarbosa/projeto-03-central-ajuda-ciclo/actions/workflows/deploy.yml/badge.svg)](https://github.com/shongasbarbosa/projeto-03-central-ajuda-ciclo/actions/workflows/deploy.yml)
[![Demo no GitHub Pages](https://img.shields.io/badge/demo-GitHub%20Pages-1E4FD8)](https://shongasbarbosa.github.io/projeto-03-central-ajuda-ciclo/)

Sistema de suporte ao aluno para plataformas de EaD, organizado pelas fases
do ciclo de uma oferta (matrícula, andamento e encerramento). Terceiro de
uma série de cinco projetos de portfólio voltados a um edital de
Desenvolvedor Web para um ambiente EaD baseado em Moodle.

- **Demonstração:** https://shongasbarbosa.github.io/projeto-03-central-ajuda-ciclo/
- **Repositório:** https://github.com/shongasbarbosa/projeto-03-central-ajuda-ciclo

## Objetivo

Oferecer à equipe de suporte de uma plataforma EaD uma central que
concentra a abertura e o atendimento de chamados, uma FAQ contextual capaz
de reduzir tickets repetidos, e relatórios de volume e tempo de resolução
segmentados pela fase do ciclo da oferta — a mesma regra de fase usada no
[projeto 1 (Vitrine de Ofertas)](https://github.com/shongasbarbosa/projeto-01-vitrine-ofertas-ead).

## Problema

Em plataformas EaD, os chamados de suporte se concentram em janelas
específicas do ciclo de uma oferta: picos de dúvidas sobre acesso e
matrícula no início, dúvidas sobre conteúdo e avaliação durante o curso, e
uma onda de pedidos sobre certificado no encerramento. Sem visibilidade por
fase, a equipe de suporte não consegue se planejar, e alunos abrem tickets
para perguntas que já têm resposta pronta na FAQ.

## Funcionalidades por perfil

### Aluno

- Login (com atalhos de demonstração)
- Abertura de chamado em etapas: escolhe a oferta, categoriza e descreve o
  problema, e recebe sugestões de artigos da FAQ antes de enviar
- Acompanhamento dos próprios chamados e conversa com o atendente
- FAQ pesquisável com feedback de "útil" / "não útil"

### Atendente

- Fila de chamados com filtros por status, categoria, prioridade, fase do
  ciclo e busca textual
- Atribuição de chamados a si mesmo, resposta, notas internas (não
  visíveis ao aluno) e mudança de status/prioridade com transições
  validadas
- Gestão da FAQ (criação, edição, publicação e exclusão de artigos)
- Painel de relatórios: volume de chamados por fase do ciclo, tempo médio
  de resolução por categoria e resumo por status

## Capturas de tela

Todas capturadas no modo demonstração (Playwright, `npm run screenshots`).

| Login | Abertura de chamado com sugestões de FAQ |
| --- | --- |
| ![Tela de login](docs/screenshots/01-login.png) | ![Abertura de chamado com sugestões de FAQ](docs/screenshots/02-novo-chamado-sugestoes-faq.png) |

| Detalhe do chamado (aluno) | Fila do atendente |
| --- | --- |
| ![Detalhe do chamado, visão do aluno](docs/screenshots/03-detalhe-chamado-aluno.png) | ![Fila de chamados do atendente](docs/screenshots/04-fila-atendente.png) |

| Detalhe do chamado com nota interna (atendente) | FAQ |
| --- | --- |
| ![Detalhe do chamado com nota interna](docs/screenshots/05-detalhe-chamado-nota-interna.png) | ![FAQ pesquisável](docs/screenshots/08-faq.png) |

| Relatórios — tema claro | Relatórios — tema escuro |
| --- | --- |
| ![Painel de relatórios no tema claro](docs/screenshots/06-relatorios-claro.png) | ![Painel de relatórios no tema escuro](docs/screenshots/07-relatorios-escuro.png) |

| Mobile (360px) |
| --- |
| ![Tela de meus chamados em 360px](docs/screenshots/09-mobile.png) |

## Stack

**Backend:** Python 3.13, Django 5.2 LTS, Django REST Framework,
djangorestframework-simplejwt, drf-spectacular, django-filter,
django-cors-headers, django-environ, PyMySQL, MySQL 8.4, gunicorn, ruff,
pytest-django.

**Frontend:** Vue 3 (Composition API) + TypeScript estrito, Vite,
Vuetify 3, Pinia, Vue Router (hash history), ECharts, Vitest, Playwright.

**Infra:** Docker, Docker Compose, GitHub Actions, GitHub Pages.

## Decisões técnicas

- **Driver MySQL: PyMySQL, não mysqlclient.** PyMySQL é puro Python — não
  exige toolchain de compilação nem bibliotecas nativas do MySQL instaladas
  na máquina de desenvolvimento (relevante especialmente no Windows nativo,
  sem WSL) nem no estágio de build da imagem Docker, que fica mais simples
  e rápida. O desempenho é equivalente para a carga de uma aplicação de
  portfólio, e o `pymysql.install_as_MySQLdb()` faz o driver ser usado de
  forma transparente pelo backend MySQL do Django.
- **SimpleJWT para autenticação.** Endpoints stateless com access/refresh
  token, adequados para consumo por uma SPA e para o modo demonstração do
  frontend (que simula os mesmos tokens em memória).
- **drf-spectacular para documentação da API.** Gera o schema OpenAPI a
  partir do próprio código (serializers, views, permissions), evitando que
  a documentação do Swagger (`/api/docs`) e do ReDoc (`/api/redoc`) fique
  dessincronizada da implementação.
- **Google Sans autohospedada via `@fontsource/google-sans`.** Distribuída
  sob a SIL Open Font License; hospedar os arquivos de fonte localmente
  evita dependência de um CDN externo e permite carregar só os pesos
  400/500/600/700 do subset latin.
- **`cycle_phase_at_opening` gravado na abertura do chamado.** A fase do
  ciclo de uma oferta muda com o tempo (matrícula → andamento →
  encerramento). Se o relatório recalculasse a fase a partir da data atual,
  o número de chamados "abertos na matrícula" de uma oferta antiga mudaria
  conforme os meses passassem. Gravar a fase vigente no momento da abertura
  torna os relatórios históricos estáveis.

## Arquitetura

```mermaid
flowchart LR
    subgraph Cliente
        SPA["Vue 3 + Vuetify\n(SPA)"]
    end

    subgraph Servidor
        API["Django REST Framework\n(gunicorn)"]
        DB[(MySQL 8.4)]
    end

    SPA -- "REST + JWT" --> API
    API -- "ORM" --> DB

    subgraph "Modo demonstração"
        SEED["seed.json"]
        SPA -. "sem backend, dados em memória" .-> SEED
    end
```

Em produção (Docker), o nginx do container `frontend` serve os arquivos
estáticos da SPA e faz proxy reverso de `/api` para o container `api`. No
GitHub Pages, a SPA é publicada em modo demonstração, sem backend.

## Modelo de dados

```mermaid
erDiagram
    USER ||--o{ TICKET : abre
    USER ||--o{ TICKET : atende
    USER ||--o{ TICKET_MESSAGE : escreve
    OFFER ||--o{ TICKET : recebe
    TICKET ||--o{ TICKET_MESSAGE : contem

    USER {
        int id
        string username
        string email
        string role "aluno | atendente"
    }
    OFFER {
        int id
        string name
        string course_name
        string category
        date enrollment_start
        date enrollment_end
        date course_start
        date course_end
    }
    TICKET {
        int id
        string category
        string priority
        string status
        string cycle_phase_at_opening
        datetime created_at
        datetime first_response_at
        datetime resolved_at
        datetime closed_at
    }
    TICKET_MESSAGE {
        int id
        text body
        bool is_internal_note
        datetime created_at
    }
    FAQ_ARTICLE {
        int id
        string question
        text answer
        string category
        string cycle_phase
        int helpful_count
        int not_helpful_count
    }
```

## Regra de fase do ciclo

A mesma regra do projeto 1, implementada tanto no backend
(`backend/offers/cycle_phase.py`) quanto no frontend
(`frontend/src/utils/cyclePhase.ts`), com testes automatizados dos dois
lados:

| Fase          | Condição                                              |
| ------------- | ------------------------------------------------------ |
| `matricula`   | até `enrollment_end` (inclusive)                        |
| `andamento`   | entre `enrollment_end` (exclusive) e `course_end` (incl.) |
| `encerramento`| após `course_end`                                       |

## Matriz de permissões

| Ação                                    | Aluno            | Atendente |
| ---------------------------------------- | ---------------- | --------- |
| Abrir chamado                            | ✅ (próprio)      | —         |
| Ver chamado                              | ✅ (só os próprios) | ✅ (todos) |
| Ver notas internas                       | ❌                | ✅        |
| Responder chamado                        | ✅ (próprio)      | ✅        |
| Criar nota interna                       | ❌                | ✅        |
| Mudar status / prioridade / atribuição   | ❌                | ✅        |
| Gerenciar FAQ (criar/editar/excluir)     | ❌                | ✅        |
| Dar feedback em artigo da FAQ            | ✅                | ✅        |
| Ver relatórios                           | ❌                | ✅        |

## Transições de status

```mermaid
stateDiagram-v2
    [*] --> aberto
    aberto --> em_andamento
    aberto --> resolvido
    em_andamento --> resolvido
    em_andamento --> aberto
    resolvido --> em_andamento
    resolvido --> fechado
    fechado --> [*]
```

Não é permitido fechar um chamado sem antes resolvê-lo — a validação é
feita no backend (`Ticket.transition_to`) e replicada no frontend
(`canTransitionTo`), inclusive no modo demonstração.

## Endpoints da API

Documentação interativa completa em `/api/docs` (Swagger) e `/api/redoc`
(ReDoc) quando o backend está no ar.

| Método | Endpoint                              | Descrição                                   |
| ------ | -------------------------------------- | -------------------------------------------- |
| POST   | `/api/auth/login`                      | Autentica e retorna tokens JWT               |
| POST   | `/api/auth/refresh`                    | Renova o access token                        |
| GET    | `/api/auth/me`                         | Dados do usuário autenticado                 |
| GET    | `/api/offers`                          | Lista ofertas com `cycle_phase` calculada    |
| GET    | `/api/tickets`                         | Lista chamados (com filtros e busca)         |
| POST   | `/api/tickets`                         | Abre um novo chamado                         |
| GET    | `/api/tickets/{id}`                    | Detalhe do chamado                           |
| PATCH  | `/api/tickets/{id}`                    | Atualiza status/prioridade/atribuição (atendente) |
| GET    | `/api/tickets/{id}/messages`           | Lista mensagens do chamado                   |
| POST   | `/api/tickets/{id}/messages`           | Envia mensagem ou nota interna               |
| GET    | `/api/faq`                             | Lista artigos publicados (com filtros)       |
| POST   | `/api/faq`                             | Cria artigo (atendente)                      |
| PATCH  | `/api/faq/{id}`                        | Edita artigo (atendente)                     |
| DELETE | `/api/faq/{id}`                        | Remove artigo (atendente)                    |
| GET    | `/api/faq/suggestions`                 | Sugestões de FAQ por texto/oferta            |
| POST   | `/api/faq/{id}/feedback`               | Registra feedback útil/não útil              |
| GET    | `/api/reports/tickets-by-cycle-phase`  | Volume e tempo médio por fase do ciclo       |
| GET    | `/api/reports/avg-resolution-time`     | Tempo médio de resolução por categoria       |
| GET    | `/api/reports/summary`                 | Totais por status e tempos médios            |
| GET    | `/api/health`                          | Healthcheck                                  |

Exemplos com curl:

```bash
# Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "aluno.demo", "password": "aluno12345"}'

# Listar ofertas (autenticado)
curl http://localhost:8000/api/offers \
  -H "Authorization: Bearer <access_token>"

# Abrir um chamado
curl -X POST http://localhost:8000/api/tickets \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"offer": 1, "category": "acesso", "priority": "media", "subject": "Não consigo acessar", "description": "Detalhes do problema."}'

# Sugestões de FAQ antes de abrir um chamado
curl "http://localhost:8000/api/faq/suggestions?query=senha&offer=1" \
  -H "Authorization: Bearer <access_token>"

# Relatório de chamados por fase do ciclo (atendente)
curl http://localhost:8000/api/reports/tickets-by-cycle-phase \
  -H "Authorization: Bearer <access_token_atendente>"
```

## Como rodar com Docker

Pré-requisitos: Docker e Docker Compose.

```bash
cp .env.example .env
docker compose up --build
```

- Frontend: http://localhost:8080
- API: http://localhost:8000/api (Swagger em `/api/docs`)
- MySQL: porta 3306 do host (ajuste `MYSQL_HOST_PORT` no `.env` se a porta
  já estiver em uso, por exemplo por um MySQL/PostgreSQL nativo)

O container `api` aplica as migrations, coleta os arquivos estáticos e
executa o `seed_demo` automaticamente antes de subir o gunicorn (esse
comportamento pode ser desativado com `SEED_DEMO_DATA=false` no `.env`).

Credenciais de demonstração (também usadas pelo `seed_demo`):

| Perfil     | Usuário            | Senha             |
| ---------- | ------------------- | ------------------ |
| Aluno      | `aluno.demo`         | `aluno12345`        |
| Atendente  | `atendente.demo`     | `atendente12345`    |

Para encerrar e remover os volumes (banco de dados incluído):

```bash
docker compose down -v
```

## Desenvolvimento local sem Docker

**Backend:**

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate  # Windows
pip install -r requirements-dev.txt
python manage.py migrate
python manage.py seed_demo
python manage.py runserver
```

Requer um MySQL 8.4 acessível localmente (ajuste as variáveis `MYSQL_*` no
`.env`, copiado de `.env.example`).

**Frontend:**

```bash
cd frontend
npm install
npm run dev
```

Use `VITE_DEMO_MODE=true` no `.env` do frontend para rodar sem backend, com
dados fictícios do `seed.json`.

## Qualidade e testes

**Backend** (`cd backend`):

```bash
ruff check .
pytest -v
```

50 testes cobrindo a regra de fase do ciclo, transições de status,
permissões por papel (incluindo um aluno tentando acessar o chamado de
outro aluno e ver notas internas), sugestões de FAQ, relatórios e
idempotência do `seed_demo`. Os testes rodam contra um MySQL real (nunca
SQLite).

**Frontend** (`cd frontend`):

```bash
npm run lint
npx vue-tsc -b
npm run test:unit      # Vitest — 25 testes
npm run build
```

**Testes e2e** (Playwright, `cd frontend`):

```bash
npm run test:e2e                              # modo demonstração
docker compose up -d                          # a partir da raiz do projeto
PLAYWRIGHT_REAL_API=true npm run test:e2e:real  # contra a API real
```

Cobrem login como aluno e como atendente, abertura de chamado, bloqueio de
telas do atendente para o aluno e logout — tanto no modo demonstração
quanto contra a API real servida pelo Docker.

Há também `npm run test:e2e:published`, que roda contra o site já publicado
no GitHub Pages (login como aluno e atendente, persistência de tema,
recarregamento de rota interna e logout).

**Screenshots** (Playwright, modo demonstração):

```bash
npm run screenshots
```

Gera as imagens em `docs/screenshots/` (login, abertura de chamado com
sugestões de FAQ, detalhe do chamado nas duas visões, fila do atendente,
relatórios nos dois temas, FAQ e a tela em 360px).

## CI/CD

- **CI** (`.github/workflows/ci.yml`): em todo push e pull request para
  `main`, roda `ruff` e `pytest` (com um MySQL 8.4 como service container)
  para o backend, e `eslint`, `vue-tsc`, `vitest` e `vite build` para o
  frontend.
- **Deploy** (`.github/workflows/deploy.yml`): em todo push para `main`,
  builda o frontend em modo demonstração (`VITE_DEMO_MODE=true`) com o
  `base` `/projeto-03-central-ajuda-ciclo/` e publica no GitHub Pages.

## Modo demonstração vs. API real

O frontend implementa a mesma interface de serviço
(`frontend/src/services/types.ts`) em duas versões, escolhidas por
`VITE_DEMO_MODE`:

- **API real** (`services/api`): consome o backend Django via `fetch` e
  JWT, com renovação automática de token em uma resposta 401.
- **Modo demonstração** (`services/demo`): não faz nenhuma chamada de
  rede. Carrega o `seed.json` exportado pelo `seed_demo`, recalcula a fase
  do ciclo das ofertas a partir da data atual, e replica em TypeScript as
  mesmas regras de permissão e de transição de status do backend. Todas as
  alterações (novos chamados, respostas, feedback de FAQ) ficam apenas em
  memória e são perdidas ao recarregar a página — por isso a faixa "Modo
  demonstração: dados fictícios, sem backend" fica sempre visível nesse
  modo.

O site publicado no GitHub Pages roda sempre em modo demonstração, já que
não há backend hospedado para ele consumir.

## Deploy da API

O backend não está hospedado permanentemente neste momento. Para publicá-lo
futuramente em um serviço com plano gratuito (sem custos), o caminho mais
direto é:

1. Escolher um provedor com free tier para containers/apps Python, como
   Render, Railway ou Fly.io.
2. Provisionar um banco MySQL gerenciado compatível com o plano gratuito
   escolhido (ou usar o addon de banco do próprio provedor).
3. Configurar as variáveis de ambiente de produção (`DJANGO_SECRET_KEY`,
   `DJANGO_ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, `MYSQL_*`), seguindo o
   `.env.example` como referência.
4. Apontar o build para a imagem `backend/Dockerfile` já existente no
   repositório, que já aplica migrations e roda o gunicorn.
5. Atualizar `VITE_API_URL` no build do frontend (ou publicar uma segunda
   versão da SPA fora do modo demonstração) para apontar para a URL pública
   da API.

Nenhuma conta foi criada nem nenhum deploy foi realizado como parte deste
portfólio — esta seção documenta o caminho, não um estado já implantado.

## Competências demonstradas

- Suporte ao usuário: fila de chamados, notas internas, transições de
  status e notificação por e-mail (console backend) ao aluno.
- Relatórios: volume e tempo de resolução segmentados por fase do ciclo e
  por categoria, com gráficos acessíveis (resumo textual ao lado de cada
  gráfico).
- Ciclos de entrada e encerramento de ofertas: regra de fase do ciclo
  compartilhada entre backend e frontend, com a fase gravada no momento da
  abertura do chamado para relatórios históricos estáveis.
- Django REST Framework e Python: apps modulares, permissões por papel,
  filtros, testes com pytest-django contra MySQL real.
- Vue.js/Vuetify: SPA com Composition API, TypeScript estrito, Pinia,
  tema claro/escuro/sistema e acessibilidade (labels, foco visível,
  contraste AA).
- MySQL: schema normalizado, charset utf8mb4, testes e seed contra o banco
  real.
- Documentação de APIs: OpenAPI gerado via drf-spectacular, Swagger e
  ReDoc.
- Docker: Dockerfiles multi-estágio, docker-compose com healthcheck e
  entrypoint idempotente.
- Git: histórico organizado em commits pequenos por área do sistema.

## Autor

**Dhyego Barbosa** — https://github.com/shongasbarbosa
