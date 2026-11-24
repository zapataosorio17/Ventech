import { existsSync, readFileSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const pages = [
  "index.html",
  "Ventech.html",
  "auth.html",
  "checkout.html",
  "mi-cuenta.html",
  "administracion.html",
  "dashboard-analitico.html",
  "orders.html",
  "terminos.html",
];
const failures = [];

for (const page of pages) {
  const pagePath = resolve(root, page);
  if (!existsSync(pagePath)) {
    failures.push(`Falta la página ${page}`);
    continue;
  }

  const html = readFileSync(pagePath, "utf8");
  const references = html.matchAll(/(?:href|src)=["']([^"'#?]+)["']/g);
  for (const match of references) {
    const reference = match[1];
    if (/^(?:https?:|mailto:|tel:|data:|javascript:)/i.test(reference)) continue;
    const assetPath = resolve(dirname(pagePath), reference.replace(/^\//, ""));
    if (!existsSync(assetPath)) {
      failures.push(`${page} referencia un archivo inexistente: ${reference}`);
    }
  }
}

for (const required of ["main.css", "app.js", "sql-sync.js", "supabase-auth.js"]) {
  if (!existsSync(resolve(root, required))) failures.push(`Falta ${required}`);
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(`Smoke test correcto: ${pages.length} páginas y sus recursos locales.`);
