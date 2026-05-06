# UltraImage AI

Plataforma brasileira de upscale premium com IA. Stack: Next.js 14 (App Router), TypeScript, Supabase, Cloudflare R2, Mercado Pago, Resend.

---

## ✦ Visão geral

```
┌─────────────────┐    ┌──────────────┐    ┌─────────────┐
│  Browser        │───▶│  Next.js     │───▶│  Supabase   │
│  (React)        │    │  (App Router)│    │  (Auth + DB)│
└─────────────────┘    └──────┬───────┘    └─────────────┘
                              │
                ┌─────────────┼─────────────┐
                ▼             ▼             ▼
         ┌───────────┐ ┌───────────┐ ┌──────────────┐
         │ Cloudflare│ │  Ultra    │ │  Mercado     │
         │   R2      │ │  Engine   │ │  Pago        │
         │ (storage) │ │  (AI)     │ │  (payments)  │
         └───────────┘ └───────────┘ └──────────────┘
```

A camada `Ultra Engine` (`src/lib/ai/upscaler.ts`) abstrai o provedor de IA. Trocar de provedor no futuro = editar um único arquivo.

---

## ✦ Estrutura

```
src/
├── app/
│   ├── (marketing)/        # landing page (pública)
│   ├── (auth)/             # login, signup, recuperação
│   ├── (app)/              # painel autenticado
│   ├── (admin)/            # dashboard admin
│   ├── api/                # rotas REST + webhooks
│   ├── auth/callback/      # OAuth callback Supabase
│   └── layout.tsx
├── components/
│   ├── landing/            # seções da home
│   ├── app/                # componentes do painel
│   └── ui/                 # primitivos compartilhados
├── lib/
│   ├── supabase/           # clients (browser + server + admin)
│   ├── ai/                 # upscaler abstraction
│   ├── storage/            # R2 client
│   ├── payments/           # Mercado Pago
│   ├── email/              # Resend
│   └── credits/            # operações atômicas de crédito
├── config/
│   ├── credits.ts          # tabela de resoluções e créditos
│   └── packages.ts         # pacotes vendáveis
└── types/database.ts
supabase/migrations/         # SQL do banco
```

---

## ✦ Setup local — passo a passo

### 1. Pré-requisitos

- Node.js 20+
- pnpm 9+ (recomendado) ou npm
- Conta nos serviços abaixo (todos têm tier grátis)

### 2. Instalar

```bash
pnpm install
cp .env.example .env.local
```

### 3. Supabase

1. Criar projeto em https://supabase.com/dashboard
2. Em **Project Settings → API** copiar `URL`, `anon key`, `service_role key`
3. Em **SQL Editor** colar e rodar o conteúdo de `supabase/migrations/001_initial_schema.sql`
4. Em **Authentication → Providers**: ativar `Email` (com confirmação) e opcionalmente `Google`
5. Preencher no `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_ROLE_KEY=
   ```

Para se tornar admin, no SQL Editor após criar sua conta:
```sql
update profiles set is_admin = true where email = 'seuemail@example.com';
```

### 4. Cloudflare R2

1. Criar bucket em https://dash.cloudflare.com (R2 → Create bucket)
2. Nome sugerido: `ultraimage-uploads`
3. Em **Manage R2 API Tokens** → criar token com permissão `Object Read & Write`
4. (Opcional, recomendado) Conectar domínio personalizado: `images.ultraimageai.com`
5. **Configurar CORS** do bucket — necessário para upload direto do browser:
   ```json
   [
     {
       "AllowedOrigins": ["http://localhost:3000", "https://ultraimageai.com"],
       "AllowedMethods": ["GET", "PUT"],
       "AllowedHeaders": ["*"],
       "MaxAgeSeconds": 3600
     }
   ]
   ```
6. Preencher:
   ```
   R2_ACCOUNT_ID=
   R2_ACCESS_KEY_ID=
   R2_SECRET_ACCESS_KEY=
   R2_BUCKET_NAME=ultraimage-uploads
   R2_PUBLIC_URL=https://images.ultraimageai.com
   ```

### 5. Provedor de IA

Atualmente o `Ultra Engine` usa Replicate internamente. Para configurar:

1. Conta em https://replicate.com → API Token
2. Escolher modelo de upscaling (recomendado: `philz1337x/clarity-upscaler`)
3. Copiar a string `owner/model:version`
4. Preencher:
   ```
   AI_PROVIDER_API_KEY=
   AI_PROVIDER_MODEL_VERSION=philz1337x/clarity-upscaler:dfad41707589...
   ```

> **Para trocar de provedor:** editar apenas `src/lib/ai/upscaler.ts`. O resto da aplicação não conhece o provedor.

### 6. Mercado Pago

1. Conta em https://www.mercadopago.com.br/developers
2. Criar aplicação → copiar `Access Token` (sandbox primeiro, produção depois)
3. Configurar URL de webhook: `https://SEU-DOMINIO/api/webhooks/mercadopago`
4. Eventos a monitorar: `payment`
5. Preencher:
   ```
   MERCADO_PAGO_ACCESS_TOKEN=
   MERCADO_PAGO_PUBLIC_KEY=
   ```

### 7. Resend (e-mails)

1. Conta em https://resend.com
2. Verificar domínio `ultraimageai.com` (DNS: SPF + DKIM)
3. Criar API key
4. Preencher:
   ```
   RESEND_API_KEY=
   RESEND_FROM_EMAIL="UltraImage <noreply@ultraimageai.com>"
   ```

### 8. Rodar

```bash
pnpm dev
```

Acesse http://localhost:3000.

---

## ✦ Fluxo de dados — uma compra completa

```
1. User clica "Comprar" no plano Essencial
   ↓
2. POST /api/checkout { packageId: 'essencial' }
   ↓
3. Backend cria payments(status=pending) e Mercado Pago Preference
   ↓
4. Browser redireciona para init_point do MP
   ↓
5. User paga via Pix/cartão
   ↓
6. MP envia webhook → POST /api/webhooks/mercadopago
   ↓
7. Backend valida com getMpPayment(), mapeia status
   ↓
8. Se approved + ainda não creditado:
   • UPDATE payments SET status='approved', credited_at=now()
   • RPC add_credits_from_payment() → credita user + log no ledger
   • Email transacional via Resend
```

## ✦ Fluxo — processamento de imagem

```
1. User arrasta imagem em /upload
   ↓
2. Frontend lê dimensões locais, exibe seletor de resolução com custo em créditos
   ↓
3. POST /api/upload-url → presigned PUT URL para R2
   ↓
4. Browser faz PUT direto para R2 (não passa pelo backend)
   ↓
5. POST /api/process { originalKey, dims, tierId }
   ↓
6. Backend:
   a. Cria image_jobs(status=pending)
   b. RPC reserve_credits() — debita do available, soma ao reserved
   c. Mark status=processing
   d. upscaler.run() — chama provedor de IA com URL assinada R2
   e. Faz fetch do resultado, re-hospeda no R2 (controle de URL/lifetime)
   f. RPC commit_credits() — converte reserved em consumido
   g. Mark status=completed, salva result_url
   h. Email "imagem pronta"
   ↓
7. Em caso de falha em qualquer ponto após (b):
   • RPC release_credits() — devolve créditos para available
   • Mark status=failed
   • Email "falhou, créditos devolvidos"
```

---

## ✦ Garantias de integridade financeira

- **Créditos nunca são debitados sem registro no ledger** (`credit_transactions`).
- Todas as operações de saldo passam por **stored procedures** (`reserve_credits`, `commit_credits`, `release_credits`, `add_credits_from_payment`) que travam a linha do `profiles` antes de ler/escrever.
- O webhook do Mercado Pago é **idempotente** (checa `credited_at` antes de creditar).
- Resultados de IA são **re-hospedados no R2** logo após o processamento, então o link entregue ao usuário não depende do provedor permanecer online.

---

## ✦ Segurança & LGPD

- RLS ativo em todas as tabelas com dados de usuário; usuários só leem o que é deles.
- `credits_available`/`credits_reserved` nunca são editáveis pelo client (só via RPCs server-side).
- URLs de imagens são presigned com expiração curta (1h para leitura, 10min para upload).
- Imagens processadas expiram em 7 dias e são removidas pelo job `expire_old_jobs()`.
- Custo interno (`internalCostBrl`) nunca é exposto a clientes — fica em `src/config/credits.ts` e só é usado em dashboards admin.

---

## ✦ Deploy

### Vercel (recomendado)
1. Conectar repositório no painel da Vercel
2. Importar todas as variáveis do `.env.local`
3. Deploy

### Webhook em produção
Após o primeiro deploy, atualizar a URL de notificação no painel do Mercado Pago para `https://SEU-DOMINIO/api/webhooks/mercadopago`.

### Cron de expiração
No Supabase, ativar `pg_cron` e agendar diariamente:
```sql
select cron.schedule('expire-old-jobs', '0 3 * * *', $$select public.expire_old_jobs()$$);
```

---

## ✦ Testando o fluxo de pagamento

Use o ambiente sandbox do Mercado Pago:
- **Cartão de teste aprovado**: 5031 4332 1540 6351 · CVV 123 · validade 11/30 · titular `APRO`
- **Cartão de teste rejeitado**: troque o titular para `OTHE`

---

## ✦ Próximos passos sugeridos

- [ ] Página de termos de uso e política de privacidade
- [ ] Reset de senha (página de redefinição após link enviado)
- [ ] Página `/admin/users` com busca e ajuste manual de créditos
- [ ] Migrar `/api/process` para fluxo assíncrono (Replicate webhook + polling no client)
- [ ] Adicionar rate limiting nas rotas públicas
- [ ] Componentes de UI compartilhados em `src/components/ui/`
- [ ] Testes E2E com Playwright nos fluxos críticos (compra, processamento)
- [ ] NF-e automática via integração com PlugNotas ou similar
- [ ] Página `/api` documentada para clientes business

---

## ✦ Comandos úteis

```bash
pnpm dev          # dev server
pnpm build        # build de produção
pnpm typecheck    # tsc --noEmit
pnpm lint         # next lint
pnpm db:types     # regenerar src/types/database.ts a partir do schema Supabase
```

---

Feito no Brasil 🇧🇷 com cuidado de ofício.
