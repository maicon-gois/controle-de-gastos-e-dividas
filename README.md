# Controle de Gastos

App pessoal de controle financeiro com projeção de dívidas, análise de consumo e sincronização na nuvem.

## Stack

- **Frontend**: Next.js 15 + React 19 + Tailwind CSS 4
- **Auth**: Firebase Authentication (e-mail/senha)
- **Banco**: Firebase Firestore (plano gratuito)
- **Deploy**: Vercel

## 1. Configurar Firebase (obrigatório, ~5 min)

1. Abra [Firebase Console](https://console.firebase.google.com/) → projeto `gen-lang-client-0360650018`
2. **Authentication** → Sign-in method → **E-mail/Senha** → **Habilitar**
3. **Firestore Database** → Criar banco (modo produção, região `southamerica-east1` se disponível)
4. **Firestore** → **Rules** → cole o conteúdo de `firestore.rules` → **Publicar**
5. Crie o usuário:
   ```bash
   node scripts/create-user.mjs
   ```
   Ou manualmente: Authentication → Users → Add user

## 2. Desenvolvimento local

```bash
npm install
npm run dev
```

Abra http://localhost:3000 e faça login.

## 3. Publicar no GitHub

```bash
# Crie o repositório em github.com/maicon-gois/controle-de-gastos-e-dividas
git remote add origin https://github.com/maicon-gois/controle-de-gastos-e-dividas.git
git branch -M main
git push -u origin main
```

## 4. Deploy na Vercel

1. Acesse [vercel.com/new](https://vercel.com/new)
2. Importe o repositório `maicon-gois/controle-de-gastos-e-dividas`
3. Framework: **Next.js** (detecta automaticamente)
4. Clique **Deploy**

As variáveis Firebase já têm defaults no código. Opcionalmente adicione as do `.env.example`.

## 5. Usar no iPhone

1. Abra a URL da Vercel no **Safari**
2. Toque em **Compartilhar** → **Adicionar à Tela de Início**
3. O app abre em tela cheia com navegação inferior

## Migração de dados locais

No primeiro login, o app **migra automaticamente** os dados do `localStorage` para o Firestore. Seus lançamentos locais não se perdem.

## Segurança

- Login obrigatório (Firebase Auth)
- Dados isolados por `userId` no Firestore
- Regras em `firestore.rules`
- HTTPS automático na Vercel
