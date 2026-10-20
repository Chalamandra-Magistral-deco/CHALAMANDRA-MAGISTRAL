import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import {
  INDEXNOW_KEY,
  REQUIRED_OUTPUT_FILES,
  SITE_PAGES,
} from "./site-manifest.mjs";

const root = process.cwd();
const checkDist = process.argv.includes("--dist");
const base = checkDist ? path.join(root, "dist") : root;
const errors = [];
let checks = 0;

function check(condition, message) {
  checks += 1;
  if (!condition) errors.push(message);
}

async function isFile(file) {
  try {
    return (await stat(file)).isFile();
  } catch {
    return false;
  }
}

function pageMarkup(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, (block) =>
      block.match(/^<script\b[^>]*>/i)?.[0] || "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "");
}

function extractIds(html) {
  const ids = new Set();
  const duplicates = new Set();
  for (const match of pageMarkup(html).matchAll(/\bid\s*=\s*(["'])(.*?)\1/gi)) {
    const id = match[2].trim();
    if (!id) continue;
    if (ids.has(id)) duplicates.add(id);
    ids.add(id);
  }
  return { ids, duplicates };
}

function localUrl(raw, page) {
  if (/^(?:https?:|mailto:|tel:|javascript:|data:|blob:|\/\/)/i.test(raw)) {
    return null;
  }
  try {
    const url = new URL(raw, `https://www.chalamandramagistral.com/${page}`);
    return {
      pathname: decodeURIComponent(url.pathname),
      fragment: decodeURIComponent(url.hash.slice(1)),
    };
  } catch {
    return { error: true };
  }
}

function routeTarget(pathname, config) {
  const redirect = (config.redirects || []).find((item) => item.source === pathname);
  if (!redirect) return null;
  return new URL(redirect.destination, "https://www.chalamandramagistral.com").pathname;
}

async function existsInSite(sitePath) {
  const clean = sitePath.replace(/^\/+/, "");
  const candidates = [];
  if (clean === "") {
    candidates.push(path.join(base, "index.html"));
  } else {
    candidates.push(path.join(base, clean));
    if (clean.endsWith("/")) candidates.push(path.join(base, clean, "index.html"));
  }

  if (!checkDist) {
    candidates.push(path.join(root, "public", clean));
    if (clean.endsWith("/")) candidates.push(path.join(root, "public", clean, "index.html"));
  }

  for (const candidate of candidates) {
    if (await isFile(candidate)) return true;
  }
  return false;
}

const config = JSON.parse(await readFile(path.join(root, "vercel.json"), "utf8"));
const packageJson = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
const htmlByPage = new Map();
const idsByPage = new Map();

// First pass: load every page and build the ID index before checking cross-page links.
for (const page of SITE_PAGES) {
  const file = path.join(root, page);
  check(await isFile(file), `Falta la página fuente requerida: ${page}`);
  if (!(await isFile(file))) continue;

  const html = await readFile(file, "utf8");
  htmlByPage.set(page, html);
  const title = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/<[^>]*>/g, "").trim();
  check(Boolean(title), `La página no tiene <title>: ${page}`);

  const { ids, duplicates } = extractIds(html);
  idsByPage.set(page, ids);
  check(duplicates.size === 0, duplicates.size
    ? `IDs duplicados en ${page}: ${[...duplicates].join(", ")}`
    : `IDs únicos en ${page}`);
}

// Second pass: validate local paths and fragment targets across all pages.
for (const page of SITE_PAGES) {
  const html = htmlByPage.get(page);
  if (!html) continue;
  const markup = pageMarkup(html);
  const tagPattern = /<([a-z][a-z0-9:-]*)\b([^<>]*?)>/gi;

  for (const tag of markup.matchAll(tagPattern)) {
    const tagName = tag[1].toLowerCase();
    const attrPattern = /\b(href|src|action|poster)\s*=\s*(?:"([^"]*)"|'([^']*)')/gi;

    for (const attr of tag[2].matchAll(attrPattern)) {
      const raw = (attr[2] ?? attr[3] ?? "").trim();
      if (!raw) continue;
      const resolved = localUrl(raw, page);
      if (!resolved) continue;
      check(!resolved.error, `URL local inválida en ${page}: ${raw}`);
      if (resolved.error) continue;

      let targetPath = resolved.pathname;
      if (targetPath === "/") targetPath = "/index.html";
      let sitePath = targetPath.replace(/^\/+/, "");
      if (targetPath.endsWith("/")) sitePath += "index.html";

      const redirectedPath = routeTarget(resolved.pathname, config);
      if (redirectedPath) {
        targetPath = redirectedPath;
        sitePath = targetPath.replace(/^\/+/, "");
      }

      check(await existsInSite(sitePath),
        `Ruta local rota en ${page} (${tagName} ${attr[1]}): ${raw}`);

      if (resolved.fragment && idsByPage.has(sitePath)) {
        check(idsByPage.get(sitePath).has(resolved.fragment),
          `Ancla inexistente en ${page}: ${raw}`);
      }
    }
  }
}

for (const required of REQUIRED_OUTPUT_FILES) {
  check(await existsInSite(required),
    `Falta recurso requerido ${checkDist ? "en dist" : "en el proyecto"}: ${required}`);
}

check(config.outputDirectory === "dist", "vercel.json debe publicar dist");
check(config.buildCommand === "pnpm run vercel-build", "vercel.json debe usar el gestor pnpm declarado");
check(typeof packageJson.scripts?.test === "string" &&
  !packageJson.scripts.test.includes("no test specified"),
  "package.json debe tener una suite de test ejecutable");

const sitemapFile = path.join(checkDist ? base : path.join(root, "public"), "sitemap.xml");
check(await isFile(sitemapFile), "No se encontró sitemap.xml para validar");
if (await isFile(sitemapFile)) {
  const sitemap = await readFile(sitemapFile, "utf8");
  const urls = [...sitemap.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)].map((m) => m[1].trim());
  check(urls.length > 0, "El sitemap debe contener al menos una URL");
  check(new Set(urls).size === urls.length, "El sitemap no debe repetir URLs");

  for (const raw of urls) {
    try {
      const url = new URL(raw);
      check(url.protocol === "https:", `URL no HTTPS en sitemap: ${raw}`);
      check(url.hostname === "www.chalamandramagistral.com", `Host no canónico en sitemap: ${raw}`);
      let sitePath = decodeURIComponent(url.pathname).replace(/^\/+/, "");
      if (!sitePath || url.pathname.endsWith("/")) sitePath = sitePath ? sitePath + "index.html" : "index.html";
      check(await existsInSite(sitePath), `El sitemap apunta a una ruta inexistente: ${raw}`);
    } catch {
      check(false, `URL inválida en sitemap: ${raw}`);
    }
  }
}

const indexHtml = htmlByPage.get("index.html") || "";
check(indexHtml.includes('data-cta="nav-services"'), "Falta el CTA de Servicios en la portada");
check(indexHtml.includes('href="ofertas.html"'), "La portada debe enlazar a ofertas.html");
const contactHtml = htmlByPage.get("contact.html") || "";
check(contactHtml.includes('id="decox-contact-form"'), "Falta el formulario central de contacto");
check(contactHtml.includes("form-decox.js"), "La página de contacto debe cargar el script compartido del formulario");
check(await isFile(path.join(root, "assets", "decox-consent.js")), "Falta el módulo compartido de consentimiento");

const cspHeaders = (config.headers || [])
  .flatMap((rule) => rule.headers || []);
const enforcedCspEntry = cspHeaders.find(({ key }) => key === "Content-Security-Policy");
const reportOnlyCspEntry = cspHeaders.find(({ key }) => key === "Content-Security-Policy-Report-Only");

function parseCsp(value) {
  return new Map(
    (value || "").split(";").map((part) => {
      const [name, ...values] = part.trim().split(/\s+/);
      return [name, values.join(" ")];
    }).filter(([name]) => Boolean(name))
  );
}

const enforcedCsp = parseCsp(enforcedCspEntry?.value);
const reportOnlyCsp = parseCsp(reportOnlyCspEntry?.value);
const requiredCspOrigins = {
  "script-src": [
    "'self'",
    "https://www.googletagmanager.com",
    "https://www.google-analytics.com",
    "https://pagead2.googlesyndication.com",
  ],
  "style-src": [
    "'self'",
    "https://fonts.googleapis.com",
    "https://cdnjs.cloudflare.com",
  ],
  "font-src": [
    "'self'",
    "https://fonts.gstatic.com",
    "https://cdnjs.cloudflare.com",
  ],
  "connect-src": [
    "'self'",
    "https://www.googletagmanager.com",
    "https://www.google-analytics.com",
    "https://formspree.io",
  ],
  "frame-src": [
    "'self'",
    "https://www.googletagmanager.com",
    "https://view.genially.com",
  ],
  "form-action": ["'self'", "https://formspree.io"],
};

check(Boolean(enforcedCspEntry), "Vercel debe aplicar una CSP por encabezado HTTP");
check(Boolean(reportOnlyCspEntry), "Vercel debe conservar una segunda CSP en modo Report-Only");
check(enforcedCsp.get("default-src") === "'self'",
  "CSP efectiva debe usar default-src 'self'");
check(reportOnlyCsp.get("default-src") === "'self'",
  "CSP Report-Only debe usar default-src 'self'");

for (const [label, directives] of [
  ["CSP efectiva", enforcedCsp],
  ["CSP Report-Only", reportOnlyCsp],
]) {
  for (const directive of [
    "script-src", "script-src-elem", "style-src", "img-src",
    "connect-src", "font-src", "frame-src", "form-action",
  ]) {
    const value = directives.get(directive) || "";
    check(Boolean(value), `${label} debe declarar ${directive}`);
    check(!/(^|\s)(?:https:|\*)(?=\s|$)/.test(value),
      `${label} ${directive} no debe permitir globalmente https: ni *`);
  }

  for (const [directive, origins] of Object.entries(requiredCspOrigins)) {
    const value = directives.get(directive) || "";
    for (const origin of origins) {
      check(value.includes(origin), `${label} ${directive} debe permitir ${origin}`);
    }
  }

  check(directives.get("object-src") === "'none'",
    `${label} debe bloquear plugins con object-src 'none'`);
  check(directives.get("base-uri") === "'self'",
    `${label} debe restringir base-uri a self`);
  check(directives.get("frame-ancestors") === "'none'",
    `${label} debe impedir la incrustación por terceros`);
  check((directives.get("img-src") || "").includes("'self'") &&
    (directives.get("img-src") || "").includes("data:"),
    `${label} debe permitir imágenes locales y data URLs necesarias`);
}

check((enforcedCsp.get("script-src") || "").includes("'unsafe-inline'"),
  "CSP efectiva debe conservar temporalmente los scripts inline existentes, incluido el bootstrap GTM");
check((enforcedCsp.get("script-src") || "").includes("'unsafe-eval'"),
  "CSP efectiva conserva temporalmente unsafe-eval hasta confirmar si GTM lo requiere");
check(!(reportOnlyCsp.get("script-src") || "").includes("'unsafe-eval'"),
  "CSP Report-Only debe probar una política sin unsafe-eval antes de retirarlo de la política efectiva");
check(reportOnlyCsp.get("script-src-attr") === "'none'",
  "CSP Report-Only debe detectar atributos de eventos inline que conviene migrar");
check(!(reportOnlyCsp.get("script-src") || "").includes("https:") &&
  !(reportOnlyCsp.get("connect-src") || "").includes("*"),
  "CSP Report-Only no debe permitir fuentes genéricas");

const homepage = htmlByPage.get("index.html") || "";
check(!/<meta\s+http-equiv=["']Content-Security-Policy["']/i.test(homepage),
  "La portada no debe definir una segunda CSP meta; vercel.json es la fuente única de política");
check(homepage.includes('id="canvas-container"'),
  "La portada debe conservar el contenedor de la experiencia 3D");
check(homepage.includes("THREE.WebGLRenderer") &&
  homepage.includes("assets/three.min.js"),
  "La portada debe conservar el motor Three.js");
check(homepage.includes('data-cta="hero-ofertas"') &&
  homepage.includes('data-cta="hero-oferta"'),
  "La portada debe conservar los dos CTA del hero");
check(homepage.includes("www.googletagmanager.com/gtm.js") &&
  homepage.includes("GTM-53TVD9VW"),
  "La portada debe conservar el cargador del contenedor Google Tag Manager");
check(homepage.includes("www.googletagmanager.com/ns.html"),
  "La portada debe conservar el fallback noscript de Google Tag Manager");


if (checkDist) {
  for (const required of REQUIRED_OUTPUT_FILES) {
    check(await isFile(path.join(base, required)), `Falta en salida Vercel: ${required}`);
  }
  for (const page of SITE_PAGES) {
    check(await isFile(path.join(base, page)), `No se copió a dist la página: ${page}`);
  }
}

if (errors.length) {
  console.error(`FALLO: ${errors.length} de ${checks} comprobaciones.`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`OK: ${checks} comprobaciones pasaron${checkDist ? " (incluida salida dist)" : ""}.`);
  console.log(`Páginas comprobadas: ${SITE_PAGES.length}. Clave IndexNow canónica: ${INDEXNOW_KEY}. No se inspeccionaron valores de secretos.`);
}
