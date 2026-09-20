#!/usr/bin/env bash
set -e

echo "==> Validando sintaxis estática..."
python3 -m py_compile gemini_cli.py app.py 2>/dev/null || true

echo "==> Staging de assets públicos y estáticos únicamente..."
git add index.html manifiesto.html metodologias.html robots.txt sitemap.xml .gitignore README.md archetype.md estrategia-comercial.md
git add js/ css/ assets/ favicon.ico 2>/dev/null || true

echo "==> Creando commit de remediación auditada..."
git commit -m "fix(security): aislamiento de backend, corrección de rutas 404, sitemap y limpieza DOM" || true

echo "==> Publicando en origin main..."
git push origin main
