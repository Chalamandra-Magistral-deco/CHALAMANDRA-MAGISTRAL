# CHALAMANDRA-MAGISTRAL

Sitio institucional y punto de entrada del ecosistema **Chalamandra Magistral DecoX**.

## Estructura

- `index.html` → Portal principal
- `arquetipo.html` → Arquitectura del sistema
- `manifiesto.html` → Manifiesto oficial
- `metodologias.html` → Metodologías y herramientas
- `contact.html` → Formulario de contacto
- `thanks.html` → Confirmación de envío
- `privacidad.html` → Política de privacidad
- `terminos.html` → Condiciones del servicio
- `assets/` → Recursos frontend activos
- `documentos/` → Documentación del proyecto
- `robots.txt`
- `sitemap.xml`

## Frontend

- HTML
- CSS
- JavaScript vanilla
- Google Tag Manager
- Tailwind CSS v4 compilado localmente con la CLI (assets/tailwind.input.css → assets/tailwind.css)
- Three.js servido desde el archivo local assets/three.min.js
- Google Fonts servido externamente
- Formspree para el formulario de contacto

## Analítica

Google Tag Manager:

`GTM-53TVD9VW`

La configuración de Google Analytics y Google Ads se gestiona desde GTM para mantener una única capa de etiquetado.

## Formulario

El formulario de contacto utiliza Formspree y redirige a:

`/thanks.html`

La validación utiliza las capacidades nativas del navegador.

## Despliegue

El repositorio utiliza `main` como línea canónica de trabajo.

El despliegue se realiza mediante la integración configurada con Vercel.

## Seguridad

- No se almacenan secretos en el frontend.
- `.env`, certificados y credenciales están excluidos de Git.
- El backend y sus credenciales, cuando existan, permanecen fuera de este repositorio público.

## Repositorios

Este repositorio es el frontend institucional de Chalamandra Magistral DecoX.

Los sistemas, aplicaciones y servicios independientes se mantienen en sus propios repositorios.

---

© 2026 Chalamandra Magistral DecoX.
Decodificar, diseñar, ejecutar.

## Validación local

Requisitos para desarrollo: Node.js, pnpm y Python 3.10+ (biblioteca estándar).
No se necesita un archivo .env para servir o construir el frontend estático.

Comandos de validación:

    npm run lint
    npm test
    npm run vercel-build

El comando lint revisa la sintaxis de los scripts JavaScript y Python. El comando
test verifica rutas, fragmentos HTML, IDs y atributos de enlaces externos mediante
unittest de Python. Este frontend no contiene TypeScript ni declaraciones tipadas;
por ello no se añade un typecheck ficticio ni se incorpora un compilador de tipos
como dependencia.

El workflow de IndexNow declara INDEXNOW_HOST, INDEXNOW_BASE_URL y
INDEXNOW_KEY_FILE en .github/workflows/indexnow.yml. Son parámetros de ese workflow,
no variables requeridas por el frontend. La clave pública de IndexNow es un archivo
de verificación, no un secreto de acceso.

## Dependencias y seguridad del build

`@tailwindcss/cli@4.3.3` fija `@parcel/watcher@2.5.1`, que incorpora la ruta
transitiva `micromatch → braces@3.0.3`. El advisory GHSA-vfj7-8cjw-p6xm no tiene
una versión corregida publicada de `braces`; por ello el bloque `overrides` de `pnpm-workspace.yaml` fija
`@parcel/watcher@2.6.0`, cuya dependencia utiliza `picomatch` y elimina esa ruta
transitiva. La instalación congelada, `pnpm audit`, los tests y el build deben
permanecer verdes. Revisar y retirar el override cuando Tailwind deje de fijar
la versión antigua de watcher.

La política CSP se configura una sola vez en `vercel.json` y se aplica como
encabezado global. Se conservan los scripts inline que el sitio usa actualmente;
la política añade `object-src 'none'`, límites de formulario, `base-uri` y
protección contra framing.
