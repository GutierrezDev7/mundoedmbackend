# Backend Mundo EDM

API em Node.js/Express para o site Mundo EDM. Fornece conteúdo (timeline, memórias, lendas, playlists, social), autenticação admin e integração com YouTube.

## Requisitos

- Node.js 18+

## Instalação

```bash
cd backendedm
npm install
```

## Configuração

Copie o arquivo de exemplo e ajuste as variáveis:

```bash
cp .env.example .env
```

Variáveis em `.env`:

| Variável | Descrição |
|----------|-----------|
| `PORT` | Porta do servidor (padrão: 4000) |
| `JWT_SECRET` | Chave secreta para tokens JWT |
| `YOUTUBE_API_KEY` | Chave da YouTube Data API v3 |
| `YOUTUBE_CHANNEL_ID` | ID do canal do YouTube |
| `DATA_DIR` | Pasta do SQLite (Railway: use `/data` com Volume) |

**Login admin:** usuário e senha ficam no banco SQLite (não em variável de ambiente). Na primeira execução é criado o usuário `mundoedm` com senha `04021991`. Para trocar a senha é preciso alterar direto no banco ou recriar o arquivo do banco.

Para obter a chave da API do YouTube: [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials → Create API Key → habilitar **YouTube Data API v3**.

## Executar

```bash
npm run dev   # desenvolvimento (reinicia ao alterar arquivos)
npm start     # produção
```

O servidor sobe em `http://localhost:4000`. O frontend usa `NEXT_PUBLIC_API_URL=http://localhost:4000` (ou configure no `.env.local` do Next.js).

## Endpoints

- `GET /api/health` — Health check
- `POST /api/auth/login` — Login (body: `{ username, password }`) → `{ token }`
- `GET /api/auth/me` — Usuário atual (header: `Authorization: Bearer <token>`)
- `GET/POST /api/content/timeline` — Vídeos da timeline
- `GET/POST /api/content/legends` — Lendas
- `GET/POST /api/content/memories` — Memórias (shorts)
- `GET/POST /api/content/playlists` — Playlists
- `GET/POST/PUT/DELETE /api/content/social` — Links sociais
- `GET /api/youtube/videos` — Lista de vídeos do canal (para admin)
- `GET /api/youtube/shorts` — Lista de shorts do canal
- `GET /api/youtube/playlists` — Lista de playlists do canal

- Os dados do site (timeline, memórias, lendas, playlists, social) são persistidos no **SQLite** (`data/mundoedm.db` ou `DATA_DIR/mundoedm.db`).
- O **login do admin** (usuário e senha em hash) fica na tabela `admin_users` do mesmo banco.
- As listas do YouTube (vídeos, shorts, playlists) são **cacheadas no banco** por 6 horas para não estourar a cota da API.

---

## Deploy no Railway

1. **Crie um serviço** em [railway.app](https://railway.app) e conecte o repositório.
2. **Defina a pasta do backend como raiz do deploy:** em Settings do serviço, use **Root Directory** = `backendedm`. Se não definir, o Railway pode usar a raiz do repo (onde está o Next.js) e aí o serviço vai rodar o frontend em vez da API — e `/api/health` dará 404.

3. **Variáveis de ambiente** — na aba Variables do serviço, configure:
   - `JWT_SECRET` = uma string longa e aleatória (ex.: gere com `openssl rand -hex 32`)
   - `YOUTUBE_API_KEY` = chave da YouTube Data API v3
   - `YOUTUBE_CHANNEL_ID` = ID do canal Mundo EDM  
   - O Railway já define `PORT` automaticamente; não precisa setar.

4. **Persistência (banco SQLite)** — o disco do Railway é efêmero. Para manter o banco (login admin, conteúdo e cache do YouTube):
   - No projeto Railway, adicione um **Volume** ao serviço.
   - Monte o volume no caminho `/data`.
   - Adicione a variável `DATA_DIR=/data`.
   O arquivo `mundoedm.db` será criado em `/data` e persistirá entre redeploys. Na primeira execução o usuário `mundoedm` com senha `04021991` é criado automaticamente.

5. **URL do backend** — após o deploy, Railway gera uma URL (ex. `https://mundoedm-backend-production-xxxx.up.railway.app`). **Teste no navegador:** abra `https://SUA-URL/api/health`; deve retornar `{"ok":true}`. Se retornar 404, confira o Root Directory (deve ser `backendedm`). No frontend (Vercel ou outro), configure:
   - `NEXT_PUBLIC_API_URL=https://sua-url-do-backend.railway.app` (sem barra no final)
   para que o site e o admin usem a API no Railway.
