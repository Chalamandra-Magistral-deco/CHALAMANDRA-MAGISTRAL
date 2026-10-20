import {
  cp, copyFile, mkdir, readFile, readdir, rm, stat
} from "node:fs/promises";
import path from "node:path";
import {
  INDEXNOW_KEY,
  REQUIRED_OUTPUT_FILES,
  ROOT_PUBLIC_FILES,
  SITE_PAGES,
} from "./site-manifest.mjs";

const root = process.cwd();
const output = path.join(root, "dist");
const publicDir = path.join(root, "public");

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

for (const page of SITE_PAGES) {
  await copyIntoOutput(page);
}

for (const file of ROOT_PUBLIC_FILES) {
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

for (const required of REQUIRED_OUTPUT_FILES) {
  if (!(await exists(path.join(output, required)))) {
    throw new Error(`No se generó el archivo requerido: ${required}`);
  }
}

const expectedIndexNowKey = INDEXNOW_KEY;
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
console.log("Páginas:", SITE_PAGES.length);
console.log("Recursos y archivos públicos copiados y verificados.");
console.log("La carpeta api no se copia como contenido estático.");
