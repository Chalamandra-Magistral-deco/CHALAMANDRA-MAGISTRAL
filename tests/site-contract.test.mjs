import test from "node:test";
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative) => readFile(path.join(root, relative), "utf8");
const exists = async (relative) => {
  await access(path.join(root, relative));
};
const existsInRootOrPublic = async (relative) => {
  for (const base of [root, path.join(root, "public")]) {
    try {
      await access(path.join(base, relative));
      return true;
    } catch {}
  }
  return false;
};

test("Vercel build contract points to the prepared static output", async () => {
  const pkg = JSON.parse(await read("package.json"));
  const vercel = JSON.parse(await read("vercel.json"));

  assert.equal(vercel.outputDirectory, "dist");
  assert.equal(vercel.buildCommand, "npm run vercel-build");
  assert.match(pkg.scripts.build, /tailwindcss/);
  assert.match(pkg.scripts["vercel-build"], /prepare-vercel-output\.mjs/);
  assert.match(pkg.scripts["vercel-build"], /npm run build/);
});

test("every HTML page listed by the output builder exists at the repository root", async () => {
  const pages = [
    "index.html",
    "ofertas.html",
    "metodologias.html",
    "arquetipo.html",
    "contact.html",
    "manifiesto.html",
    "privacidad.html",
    "terminos.html",
    "thanks.html",
  ];

  for (const page of pages) {
    await exists(page);
  }

  const prep = await read("scripts/prepare-vercel-output.mjs");
  for (const page of pages) {
    assert.ok(prep.includes(`"${page}"`), `output builder must publish ${page}`);
  }
});

test("critical browser assets required by the output builder are present", async () => {
  const required = [
    "assets/tailwind.input.css",
    "assets/decox-consent.js",
    "assets/form-decox.js",
    "assets/three.min.js",
  ];

  for (const file of required) {
    await exists(file);
  }
});

test("required public files are available from root or public/", async () => {
  const required = [
    "robots.txt",
    "sitemap.xml",
    "ads.txt",
    "app-ads.txt",
    "ffe446a24dd9e7aad5e9d9287a6c0d90.txt",
  ];
  for (const file of required) {
    assert.ok(await existsInRootOrPublic(file), `missing public asset ${file}`);
  }
});

test("homepage loads one GTM bootstrap and its noscript fallback", async () => {
  const html = await read("index.html");
  const bootstraps = html.match(/googletagmanager\.com\/gtm\.js\?id=/g) ?? [];
  const fallbacks = html.match(/googletagmanager\.com\/ns\.html\?id=/g) ?? [];

  assert.equal(bootstraps.length, 1, "only one GTM script bootstrap is expected");
  assert.equal(fallbacks.length, 1, "one GTM noscript fallback is expected");
  assert.ok(html.includes("GTM-53TVD9VW"), "canonical GTM container ID must remain");
});

test("output preparation keeps missing assets and conflicts fail-closed", async () => {
  const prep = await read("scripts/prepare-vercel-output.mjs");

  assert.ok(prep.includes("Falta archivo requerido"));
  assert.ok(prep.includes("No se generó el archivo requerido"));
  assert.ok(prep.includes("La carpeta api no se copia"));
});
