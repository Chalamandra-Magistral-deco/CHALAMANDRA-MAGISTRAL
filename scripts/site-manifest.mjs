export const INDEXNOW_KEY = "ffe446a24dd9e7aad5e9d9287a6c0d90";

export const SITE_PAGES = Object.freeze([
  "index.html",
  "ofertas.html",
  "metodologias.html",
  "arquetipo.html",
  "contact.html",
  "manifiesto.html",
  "privacidad.html",
  "terminos.html",
  "thanks.html",
]);

// This verification file exists only in the repository root.
// The IndexNow key and the second verification file are canonical under public/.
export const ROOT_PUBLIC_FILES = Object.freeze([
  "googleadcf0e30d28ba73f.html",
]);

export const REQUIRED_OUTPUT_FILES = Object.freeze([
  ...SITE_PAGES,
  "assets/tailwind.css",
  "assets/decox-consent.js",
  "assets/form-decox.js",
  "assets/three.min.js",
  "robots.txt",
  "sitemap.xml",
  "ads.txt",
  "app-ads.txt",
  "googleadcf0e30d28ba73f.html",
  "googlex1nuAArJmQjW7N7sbnpkPQnlCcZw9uAlUw81tN9Gj3A.html",
  `${INDEXNOW_KEY}.txt`,
]);
