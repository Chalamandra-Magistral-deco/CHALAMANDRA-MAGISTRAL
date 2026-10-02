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
- Tailwind CSS mediante CDN
- Three.js mediante CDN
- Google Fonts
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
