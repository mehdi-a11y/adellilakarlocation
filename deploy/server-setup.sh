#!/usr/bin/env bash
# Configuration initiale du VPS Contabo (Ubuntu 22.04 / 24.04)
# À exécuter UNE SEULE FOIS en root sur le serveur :
#   curl -fsSL https://raw.githubusercontent.com/VOTRE_USER/VOTRE_REPO/main/deploy/server-setup.sh | bash
# Ou copiez le script sur le serveur et lancez : bash server-setup.sh
set -euo pipefail

APP_DIR="/var/www/adel-immobilier"
REPO_URL="${REPO_URL:-}"
DOMAIN="${DOMAIN:-}"

echo "=========================================="
echo " Configuration VPS — Adel Immobilier"
echo "=========================================="

if [ "$(id -u)" -ne 0 ]; then
  echo "Lancez ce script en root (sudo bash server-setup.sh)"
  exit 1
fi

echo "→ Mise à jour du système..."
apt-get update
apt-get upgrade -y

echo "→ Installation des paquets..."
apt-get install -y curl git nginx certbot python3-certbot-nginx ufw

echo "→ Installation de Node.js 20..."
if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

echo "→ Installation de PM2..."
npm install -g pm2

echo "→ Pare-feu (SSH, HTTP, HTTPS)..."
ufw allow OpenSSH
ufw allow "Nginx Full"
echo "y" | ufw enable || true

mkdir -p "$APP_DIR"

if [ -n "$REPO_URL" ]; then
  echo "→ Clone du dépôt..."
  if [ ! -d "$APP_DIR/.git" ]; then
    git clone "$REPO_URL" "$APP_DIR"
  fi
else
  echo "⚠ REPO_URL non défini. Clonez le repo manuellement dans $APP_DIR"
fi

echo "→ Configuration Nginx..."
cat >/etc/nginx/sites-available/adel-immobilier <<'NGINX'
server {
    listen 80;
    server_name DOMAIN_PLACEHOLDER www.DOMAIN_PLACEHOLDER;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINX

if [ -n "$DOMAIN" ]; then
  sed -i "s/DOMAIN_PLACEHOLDER/$DOMAIN/g" /etc/nginx/sites-available/adel-immobilier
else
  sed -i "s/DOMAIN_PLACEHOLDER/_/g" /etc/nginx/sites-available/adel-immobilier
  echo "⚠ DOMAIN non défini — éditez /etc/nginx/sites-available/adel-immobilier"
fi

ln -sf /etc/nginx/sites-available/adel-immobilier /etc/nginx/sites-enabled/adel-immobilier
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
systemctl enable nginx

chmod +x "$APP_DIR/deploy/deploy.sh" 2>/dev/null || true

echo ""
echo "=========================================="
echo " Prochaines étapes manuelles :"
echo "=========================================="
echo "1. Créez $APP_DIR/.env.production (voir .env.production.example)"
echo "2. DNS : enregistrement A → IP de ce VPS pour $DOMAIN"
echo "3. Premier déploiement : bash $APP_DIR/deploy/deploy.sh"
echo "4. SSL : certbot --nginx -d $DOMAIN -d www.$DOMAIN"
echo "5. PM2 au démarrage : pm2 startup && pm2 save"
echo "6. GitHub Actions : ajoutez les secrets VPS (voir DEPLOYMENT.md)"
echo "=========================================="
