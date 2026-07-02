const API_KEY = "AIzaSyA5bD5ZRxDVtShst7g88EytE3TS6j_86yI";
const EMAIL = "maicongn@hotmail.com";
const PASSWORD = "Cg2026#Fin$Maicon!k9Xp";

const res = await fetch(
  `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD, returnSecureToken: true }),
  }
);
const data = await res.json();
if (data.error) {
  console.error("ERRO:", data.error.message);
  process.exit(1);
}
console.log("OK login UID:", data.localId);
