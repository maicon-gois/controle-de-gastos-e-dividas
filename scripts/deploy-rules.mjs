/**
 * Publica as regras do Firestore no banco nomeado usando a conta de serviço.
 * Uso: node scripts/deploy-rules.mjs
 */
import { createSign } from "node:crypto";
import { readFileSync } from "node:fs";

const KEY_PATH =
  process.env.SA_KEY ||
  "C:\\Users\\maiconnascimento\\Downloads\\gen-lang-client-0360650018-4fdcc9dd4545.json";
const PROJECT = "gen-lang-client-0360650018";
const DATABASE = "ai-studio-4eea3ee6-d3e1-41ad-b959-3632f0fa4212";
const RULES_FILE = "firestore.rules";

const sa = JSON.parse(readFileSync(KEY_PATH, "utf8"));
const rulesSource = readFileSync(RULES_FILE, "utf8");

function b64url(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

async function getAccessToken() {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claim = {
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/cloud-platform",
    aud: sa.token_uri,
    exp: now + 3600,
    iat: now,
  };
  const unsigned = `${b64url(JSON.stringify(header))}.${b64url(
    JSON.stringify(claim)
  )}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsigned);
  const signature = signer
    .sign(sa.private_key)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
  const jwt = `${unsigned}.${signature}`;

  const res = await fetch(sa.token_uri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error("Token: " + JSON.stringify(data));
  return data.access_token;
}

async function main() {
  const token = await getAccessToken();
  const auth = { Authorization: `Bearer ${token}` };

  // 1. Criar ruleset
  const rulesetRes = await fetch(
    `https://firebaserules.googleapis.com/v1/projects/${PROJECT}/rulesets`,
    {
      method: "POST",
      headers: { ...auth, "Content-Type": "application/json" },
      body: JSON.stringify({
        source: { files: [{ name: RULES_FILE, content: rulesSource }] },
      }),
    }
  );
  const ruleset = await rulesetRes.json();
  if (!ruleset.name)
    throw new Error("Ruleset falhou: " + JSON.stringify(ruleset));
  console.log("Ruleset criado:", ruleset.name);

  // 2. Apontar o release do banco para o novo ruleset
  const releaseId = `cloud.firestore/${DATABASE}`;
  const releaseName = `projects/${PROJECT}/releases/${releaseId}`;

  let relRes = await fetch(
    `https://firebaserules.googleapis.com/v1/projects/${PROJECT}/releases/${encodeURIComponent(
      releaseId
    )}`,
    {
      method: "PATCH",
      headers: { ...auth, "Content-Type": "application/json" },
      body: JSON.stringify({
        release: { name: releaseName, rulesetName: ruleset.name },
      }),
    }
  );

  if (relRes.status === 404) {
    // release ainda não existe: cria
    relRes = await fetch(
      `https://firebaserules.googleapis.com/v1/projects/${PROJECT}/releases`,
      {
        method: "POST",
        headers: { ...auth, "Content-Type": "application/json" },
        body: JSON.stringify({ name: releaseName, rulesetName: ruleset.name }),
      }
    );
  }

  const rel = await relRes.json();
  if (!rel.name) throw new Error("Release falhou: " + JSON.stringify(rel));
  console.log("Regras publicadas no banco:", DATABASE);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
