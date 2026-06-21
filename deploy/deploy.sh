#!/usr/bin/env bash
# Déploiement / mise à jour de l'application sur le VPS Contabo
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/adel-immobilier}"
BRANCH="${BRANCH:-main}"

cd "$APP_DIR"

echo "=========================================="
echo " Adel Immobilier — déploiement"
echo " $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
echo "=========================================="

if [ -f .env.production ]; then
  set -a
  # shellcheck disable=SC1091
  source .env.production
  set +a
else
  echo "ERREUR: .env.production introuvable dans $APP_DIR"
  exit 1
fi

echo "→ Récupération du code (branche $BRANCH)..."
git fetch origin "$BRANCH"
git reset --hard "origin/$BRANCH"

echo "→ Installation des dépendances..."
npm ci

echo "→ Build Next.js (production)..."
npm run build

echo "→ Préparation du mode standalone..."
cp -r public .next/standalone/public
cp -r .next/static .next/standalone/.next/static

echo "→ Redémarrage PM2..."
if pm2 describe adel-immobilier >/dev/null 2>&1; then
  pm2 restart adel-immobilier --update-env
else
  pm2 start ecosystem.config.cjs
fi
pm2 save

echo "✓ Déploiement terminé avec succès."
