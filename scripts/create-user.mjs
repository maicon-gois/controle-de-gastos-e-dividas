/**
 * One-time script to create the Firebase Auth user.
 * Run: node scripts/create-user.mjs
 *
 * Requires Email/Password sign-in enabled in Firebase Console:
 * Authentication → Sign-in method → Email/Password → Enable
 */

const API_KEY = process.env.FIREBASE_API_KEY || "AIzaSyA5bD5ZRxDVtShst7g88EytE3TS6j_86yI";
const EMAIL = process.env.USER_EMAIL || "maicongn@hotmail.com";
const PASSWORD = process.env.USER_PASSWORD || "Cg2026#Fin$Maicon!k9Xp";

async function createUser() {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: EMAIL,
        password: PASSWORD,
        returnSecureToken: true,
      }),
    }
  );

  const data = await res.json();

  if (data.error) {
    if (data.error.message === "EMAIL_EXISTS") {
      console.log("✓ Usuário já existe:", EMAIL);
      return;
    }
    console.error("Erro:", data.error.message);
    process.exit(1);
  }

  console.log("✓ Usuário criado com sucesso!");
  console.log("  E-mail:", EMAIL);
  console.log("  UID:", data.localId);
}

createUser();
