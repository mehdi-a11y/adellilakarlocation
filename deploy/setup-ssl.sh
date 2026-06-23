#!/usr/bin/env bash
# Active HTTPS (Let's Encrypt) pour Adel Immobilier sur le VPS.
# Usage (root sur le serveur) :
#   CERTBOT_EMAIL=votre@email.com bash /var/www/adel-immobilier/deploy/setup-ssl.sh
set -euo pipefail

DOMAIN="${DOMAIN:-adellilakarlocation.site}"
CERTBOT_EMAIL="${CERTBOT_EMAIL:-}"

if [ "$(id -u)" -ne 0 ]; then
  echo "Lancez ce script en root : sudo bash deploy/setup-ssl.sh"
  exit 1
fi

if [ -z "$CERTBOT_EMAIL" ]; then
  echo "Définissez CERTBOT_EMAIL pour Let's Encrypt, par ex. :"
  echo "  CERTBOT_EMAIL=admin@example.com bash deploy/setup-ssl.sh"
  exit 1
fi

echo "→ Configuration Nginx pour $DOMAIN (HTTP → Next.js:3000)..."
cat >/etc/nginx/sites-available/adel-immobilier <<NGINX
server {
    listen 80;
    server_name ${DOMAIN} www.${DOMAIN};

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
NGINX

ln -sf /etc/nginx/sites-available/adel-immobilier /etc/nginx/sites-enabled/adel-immobilier
nginx -t
systemctl reload nginx

echo "→ Obtention du certificat SSL..."
certbot --nginx \
  -d "$DOMAIN" \
  -d "www.$DOMAIN" \
  --non-interactive \
  --agree-tos \
  --email "$CERTBOT_EMAIL" \
  --redirect

nginx -t
systemctl reload nginx

echo ""
echo "✓ HTTPS activé pour https://${DOMAIN}"
echo "  Vérifiez dans Safari : https://${DOMAIN}"
