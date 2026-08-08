# Vitalis Website

Landing page e área autenticada da Vitalis, uma plataforma de organização e acompanhamento de rotinas medicamentosas.

## Stack

- Next.js 16 com App Router
- React 19 e TypeScript
- CSS Modules, Tailwind CSS e componentes próprios
- Three.js / React Three Fiber para experiências 3D
- Motion para transições e microinterações
- Visx para gráficos do Dashboard
- Supabase Auth e Postgres com `@supabase/ssr`

## Estrutura

- `app/`: rotas públicas, autenticação, HUB e Dashboard
- `components/site/`: landing page, storytelling, atmosfera e navegação
- `components/dashboard/`: layout autenticado, gráficos e formulários
- `lib/supabase/`: clientes browser/server, sessão e proteção de rotas
- `types/database.ts`: tipos gerados para o banco Supabase
- `public/`: assets estáticos

## Desenvolvimento

Requisitos: Node.js 20+ e pnpm.

```bash
pnpm install
Copy-Item .env.example .env.local
pnpm dev
```

A aplicação fica disponível em `http://localhost:3000`.

## Variáveis de ambiente

Configure no `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

O arquivo `.env.local` não deve ser versionado. No Supabase, configure `/auth/callback` como URL autorizada para confirmação de e-mail.

## Scripts

```bash
pnpm dev      # servidor de desenvolvimento
pnpm build    # build de produção
pnpm start    # servidor de produção local
pnpm lint     # ESLint
```

## Autenticação

As rotas `/hub` e `/dashboard` exigem sessão autenticada. O fluxo de login e criação de conta usa Supabase Auth; o callback `/auth/callback` troca o código de confirmação por uma sessão server-side.

As políticas de acesso aos dados devem permanecer configuradas no Supabase com Row Level Security (RLS).


## Produção

https://vitalis-website-main.vercel.app

