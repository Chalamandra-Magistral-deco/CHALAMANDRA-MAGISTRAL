#!/bin/bash
set -e
echo "🚀 Deploy Chalamandra Magistral"
git add index.html manifiesto.html metodologias.html assets/ robots.txt documentos/*.md 2>/dev/null || true
git commit -m "${1:-update: sincronización de contenido}" || echo "Sin cambios"
git push origin main
echo "✅ Deploy completado"
