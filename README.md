# CHALAMANDRA-MAGISTRAL

Sitio institucional + API de servicios de **Chalamandra Magistral DecoX**.

## Estructura

- index.html           -> Portal principal
- manifiesto.html      -> Manifiesto oficial
- metodologias.html    -> Kit de metodologias
- assets/              -> Recursos activos (form-decox.js)
- documentos/          -> Documentacion interna
- sitemap.xml
- robots.txt
- [backend Python - fuera del repo publico]
  - app.py             -> API FastAPI (Gemini + Wallet)
  - gemini_service.py
  - wallet_service.py
  - gemini_cli.py

## Frontend (publico)

- HTML + CSS + JavaScript vanilla
- CDNs: Tailwind, Three.js, Font Awesome, Google Fonts
- Deploy automatico: Vercel desde main

## Backend (privado, local)

- Python 3.11 + FastAPI + uvicorn
- Endpoints:
  - POST /api/gemini       - Procesamiento con Gemini
  - POST /api/wallet/pass  - Credenciales Google Wallet
- Ejecucion: python app.py (puerto 8000)
- Variables de entorno requeridas:
  - GEMINI_API_KEY  - Google AI Studio
  - WALLET_SA_KEY   - ruta al service_account.json

## Variables de entorno

Ver .env.example para plantilla. El archivo .env real no se versiona.

## Deploy

    # Frontend (automatico al hacer push a main)
    git push origin main
    # -> Vercel re-despliega en ~1 min

    # Backend (manual, cuando este listo)
    python app.py

## Seguridad

- .env, service_account.json, *.py, *.bak estan en .gitignore
- Nunca subir credenciales al repo publico
- El backend vive fuera del repo publico

## Documentacion interna

- documentos/archetype.md               - Arquitectura conceptual
- documentos/estrategia-comercial.md    - Modelo de negocio (privado)

---

© 2026 Chalamandra Magistral DecoX. Decodificar, disenar, ejecutar.
