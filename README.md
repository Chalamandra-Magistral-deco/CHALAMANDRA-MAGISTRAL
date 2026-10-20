# CHALAMANDRA-MAGISTRAL

Sitio institucional estático y punto de entrada del ecosistema **Chalamandra Magistral DecoX**.

## Estructura principal

- `index.html` — portal principal
- `ofertas.html` — servicios y propuestas comerciales
- `metodologias.html` — metodologías y herramientas interactivas
- `arquetipo.html` — arquitectura del sistema
- `manifiesto.html` — manifiesto oficial
- `contact.html` y `thanks.html` — formulario y confirmación
- `privacidad.html` y `terminos.html` — páginas legales
- `assets/` — JavaScript, recursos gráficos y CSS generado
- `public/` — archivos públicos que se copian al directorio final
- `documentos/` — documentación de apoyo
- `scripts/site-manifest.mjs` — inventario canónico de páginas y recursos de salida
- `scripts/prepare-vercel-output.mjs` — preparación de `dist/`
- `scripts/validate-site.mjs` — validación estática de rutas, anclas, markup, sitemap y salida de despliegue

## Frontend

- HTML y CSS
- JavaScript vanilla
- Tailwind CSS compilado localmente mediante `@tailwindcss/cli`
- Three.js servido desde `assets/three.min.js`
- Google Fonts y Google Tag Manager
- Formspree para el formulario de contacto

La identidad visual y el comportamiento de las páginas existentes se mantienen en sus propios archivos. El manifiesto evita duplicar el inventario de archivos entre el build y sus pruebas.

## Analítica y consentimiento

Google Tag Manager: `GTM-53TVD9VW`.

La configuración de Google Analytics y Google Ads se gestiona desde GTM. El módulo compartido `assets/decox-consent.js` aplica la preferencia de consentimiento antes de habilitar las etiquetas correspondientes.

## Formulario

El formulario de contacto utiliza Formspree y redirige a `/thanks.html`. La validación utiliza las capacidades nativas del navegador y `assets/form-decox.js` conserva la atribución del origen y de la oferta.

## Variables de entorno

El frontend estático no necesita variables de entorno para renderizarse. `.env.example` documenta esa condición y no contiene secretos.

El script opcional de notificación a IndexNow utiliza estas variables al ejecutarse manualmente:

- `INDEXNOW_HOST` — host canónico, sin protocolo
- `INDEXNOW_BASE_URL` — URL HTTPS del sitio
- `INDEXNOW_KEY_FILE` — ruta al archivo público cuya clave coincide con el nombre del archivo

El workflow de GitHub Actions define estas variables de forma explícita. La clave IndexNow es un archivo de verificación público; no es una credencial de API. No añadir tokens ni contraseñas a Git, HTML, Jira o Confluence.

## Verificación local

Se utiliza pnpm, declarado en `package.json` y `pnpm-lock.yaml`:

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm test
pnpm run vercel-build
pnpm run test:build
```

- `lint` comprueba sintaxis de los módulos JavaScript propios y del script Python.
- `test` comprueba rutas locales, anclas, IDs duplicados, sitemap, archivos requeridos y contratos estructurales.
- `vercel-build` genera CSS y prepara `dist/`.
- `test:build` verifica la salida que se publicará.
- Typecheck no aplica actualmente: el repositorio no contiene fuentes TypeScript. El workflow fallará si aparecen archivos TypeScript sin configurar un typecheck real.

## Build y despliegue

El comando de build usado por Vercel es `pnpm run vercel-build`; `vercel.json` publica el directorio `dist`. Los pull requests generan preview y ejecutan las comprobaciones de calidad. La promoción a producción debe realizarse después de aprobar la revisión y verificar el preview.

## Seguridad y gobernanza

- No se almacenan secretos en el frontend.
- `.env`, certificados y credenciales están excluidos de Git.
- La configuración del backend y sus credenciales permanecen fuera de este repositorio público.
- Los archivos duplicados de verificación se mantienen en un único origen canónico; el build valida los recursos que debe publicar.

## Repositorios

Este repositorio es el frontend institucional. Los sistemas, aplicaciones y servicios independientes se mantienen en sus propios repositorios.

---

© 2026 Chalamandra Magistral DecoX.  
Decodificar, diseñar, ejecutar.
