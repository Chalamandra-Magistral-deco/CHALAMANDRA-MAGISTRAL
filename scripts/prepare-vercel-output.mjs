import {
  cp, copyFile, mkdir, readFile, readdir, rm, stat
} from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const output = path.join(root, "dist");
const publicDir = path.join(root, "public");

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

const rootPublicFiles = [
  "ads.txt",
  "app-ads.txt",
  "robots.txt",
  "sitemap.xml",
  "googleadcf0e30d28ba73f.html",
  "googlex1nuAArJmQjW7N7sbnpkPQnlCcZw9uAlUw81tN9Gj3A.html",
  "ffe446a24dd9e7aad5e9d9287a6c0d90.txt",
];

async function exists(file) {
  try {
    await stat(file);
    return true;
  } catch {
    return false;
  }
}

async function copyIntoOutput(relativePath) {
  const source = path.join(root, relativePath);
  const destination = path.join(output, relativePath);

  if (!(await exists(source))) {
    throw new Error(`Falta archivo requerido: ${relativePath}`);
  }

  await mkdir(path.dirname(destination), { recursive: true });
  await copyFile(source, destination);
}

async function mergePublicDirectory(sourceDir, relativeDir = "") {
  if (!(await exists(sourceDir))) return;

  for (const entry of await readdir(sourceDir, { withFileTypes: true })) {
    const relative = path.posix.join(relativeDir, entry.name);
    const source = path.join(sourceDir, entry.name);
    const destination = path.join(output, relative);

    if (entry.isDirectory()) {
      await mergePublicDirectory(source, relative);
      continue;
    }

    if (await exists(destination)) {
      const [a, b] = await Promise.all([
        readFile(source),
        readFile(destination),
      ]);

      if (!a.equals(b)) {
        throw new Error(
          `Conflicto entre public/${relative} y el archivo de raíz. ` +
          "Se detuvo la preparación para evitar sobrescribir contenido."
        );
      }

      continue;
    }

    await mkdir(path.dirname(destination), { recursive: true });
    await copyFile(source, destination);
  }
}

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

for (const page of pages) {
  await copyIntoOutput(page);
}

for (const file of rootPublicFiles) {
  if (await exists(path.join(root, file))) {
    await copyIntoOutput(file);
  }
}

await cp(
  path.join(root, "assets"),
  path.join(output, "assets"),
  { recursive: true }
);

await mergePublicDirectory(publicDir);

for (const required of [
  "index.html",
  "ofertas.html",
  "metodologias.html",
  "arquetipo.html",
  "contact.html",
  "assets/tailwind.css",
  "assets/decox-consent.js",
  "assets/form-decox.js",
  "assets/three.min.js",
  "robots.txt",
  "sitemap.xml",
  "ads.txt",
  "app-ads.txt",
  "ffe446a24dd9e7aad5e9d9287a6c0d90.txt",
]) {
  if (!(await exists(path.join(output, required)))) {
    throw new Error(`No se generó el archivo requerido: ${required}`);
  }
}

const expectedIndexNowKey = "ffe446a24dd9e7aad5e9d9287a6c0d90";
const publishedIndexNowKey = (
  await readFile(path.join(output, expectedIndexNowKey + ".txt"), "utf8")
).trim();

if (
  publishedIndexNowKey !== expectedIndexNowKey ||
  !/^[a-f0-9]{32}$/.test(publishedIndexNowKey)
) {
  throw new Error(
    "La clave IndexNow no coincide con el nombre del archivo o su formato es inválido."
  );
}

console.log(`Salida estática preparada: ${output}`);
console.log("Páginas:", pages.length);
console.log("Recursos y archivos públicos copiados y verificados.");
console.log("La carpeta api no se copia como contenido estático.");
