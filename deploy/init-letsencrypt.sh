#!/bin/sh
# Bootstrap Let's Encrypt certificates, then bring up the full stack.
#
# Run once on the server after filling in .env (DOMAIN, CERTBOT_EMAIL, and make
# sure DOMAIN's DNS already points here):
#
#   ./deploy/init-letsencrypt.sh
#
# It creates a throwaway self-signed cert so nginx can boot, starts nginx to
# serve the ACME http-01 challenge, swaps in a real certificate, and reloads.
# Safe to re-run.
set -eu

cd "$(dirname "$0")/.." # repo root

if [ ! -f .env ]; then
  echo "ERROR: .env not found. Copy .env.example to .env and fill it in." >&2
  exit 1
fi
# shellcheck disable=SC1091
. ./.env

: "${DOMAIN:?DOMAIN must be set in .env}"
: "${CERTBOT_EMAIL:?CERTBOT_EMAIL must be set in .env}"

cert_path="/etc/letsencrypt/live/$DOMAIN"
rsa_key_size=4096

echo "### 1/5 Creating a temporary self-signed certificate for $DOMAIN ..."
docker compose run --rm --entrypoint sh certbot -c "\
  mkdir -p '$cert_path' && \
  openssl req -x509 -nodes -newkey rsa:$rsa_key_size -days 1 \
    -keyout '$cert_path/privkey.pem' \
    -out '$cert_path/fullchain.pem' \
    -subj '/CN=localhost'"

echo "### 2/5 Starting nginx (and app) ..."
docker compose up -d nginx

echo "### 3/5 Removing the temporary certificate ..."
docker compose run --rm --entrypoint sh certbot -c "\
  rm -rf '/etc/letsencrypt/live/$DOMAIN' \
         '/etc/letsencrypt/archive/$DOMAIN' \
         '/etc/letsencrypt/renewal/$DOMAIN.conf'"

echo "### 4/5 Requesting a Let's Encrypt certificate for $DOMAIN ..."
docker compose run --rm certbot certonly --webroot -w /var/www/certbot \
  --email "$CERTBOT_EMAIL" \
  -d "$DOMAIN" \
  --rsa-key-size "$rsa_key_size" \
  --agree-tos --no-eff-email --force-renewal

echo "### 5/5 Reloading nginx and starting the renewal service ..."
docker compose exec nginx nginx -s reload
docker compose up -d

echo
echo "Done. Visit https://$DOMAIN"
