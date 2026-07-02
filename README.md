# Controle de Gastos

App pessoal de controle financeiro com projeção de dívidas, análise de consumo e sincronização na nuvem.

## Stack

- **Frontend**: Next.js 15 + React 19 + Tailwind CSS 4
- **Auth**: Firebase Authentication (e-mail/senha)
- **Banco**: Firebase Firestore (plano gratuito)
- **Deploy**: Vercel

## Desenvolvimento local

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Configuração Firebase

1. Acesse [Firebase Console](https://console.firebase.google.com/) → projeto `gen-lang-client-0360650018`
2. **Authentication** → Sign-in method → habilite **E-mail/Senha**
3. **Firestore** → crie o banco (modo produção) e publique as regras de `firestore.rules`
4. Crie o usuário:
   ```bash
   node scripts/create-user.mjs
   ```

## Deploy na Vercel

1. Faça push para o GitHub (`maicon-gois/controle-de-gastos-e-dividas`)
2. Importe o repositório na [Vercel](https://vercel.com)
3. Variáveis de ambiente (opcional — já há defaults no código):
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`

## iPhone (PWA)

No Safari: Compartilhar → **Adicionar à Tela de Início**. O app abre em tela cheia com navegação inferior.

## Segurança

- Login obrigatório (Firebase Auth)
- Dados isolados por `userId` no Firestore
- Regras de segurança em `firestore.rules`
- HTTPS automático na Vercel
