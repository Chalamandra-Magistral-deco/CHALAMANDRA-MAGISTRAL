#!/usr/bin/env bash
set -e
echo "==> Validando backend..."
python3 -m py_compile app.py chalamandra_cli.py chalamandra_sdk.py 2>/dev/null || true

echo "==> Staging solo público..."
git add index.html manifiesto.html metodologias.html contact.html privacidad.html terminos.html robots.txt sitemap.xml .gitignore README.md
git add js/ css/ assets/ favicon.ico 2>/dev/null || true

echo "==> Commit..."
git status --short
git commit -m "fix(security): aislamiento backend, 404 y sitemap" || true

echo "==> Push..."
git push origin main
