# Deployment

Production stack via Docker Compose: the Next.js app behind an nginx reverse
proxy that terminates TLS, with certbot issuing and auto-renewing Let's Encrypt
certificates.

```
            :80  ┌─────────┐  redirect → :443
internet ──────▶ │  nginx  │ ───────────────┐
            :443 │ (TLS)   │ ──proxy──▶ app:3000 (Next.js, internal only)
                 └─────────┘
                      ▲ certs (shared volume)
                 ┌─────────┐
                 │ certbot │  renews every 12h
                 └─────────┘
```

The app container is **not** published to the host — only nginx is reachable
from the internet (ports 80/443). nginx reaches the app over the compose
network as `app:3000`.

## Files

- [`../docker-compose.yml`](../docker-compose.yml) — the `app`, `nginx`, `certbot` services.
- [`../Dockerfile`](../Dockerfile) — multi-stage build of the Next.js standalone server.
- [`nginx/templates/default.conf.template`](nginx/templates/default.conf.template) — reverse-proxy + TLS config (`${DOMAIN}` filled in at runtime).
- [`init-letsencrypt.sh`](init-letsencrypt.sh) — one-time certificate bootstrap.
- [`../.env.example`](../.env.example) — environment template.

## Prerequisites

- A server with **Docker + Docker Compose v2** (`docker compose`, not the old `docker-compose`).
- A domain whose **A/AAAA record points at the server**, and ports **80 + 443 open**.
- An OpenAI API key.

## First-time setup

```sh
# 1. Configure
cp .env.example .env
#    edit .env → set OPENAI_API_KEY, DOMAIN, CERTBOT_EMAIL

# 2. Build the app image
docker compose build

# 3. Bootstrap TLS certificates + start the stack
./deploy/init-letsencrypt.sh
```

`init-letsencrypt.sh` installs a temporary self-signed cert so nginx can start,
serves the ACME challenge over port 80, obtains the real certificate, reloads
nginx, and brings the renewal service up. When it finishes, `https://<DOMAIN>`
is live.

> Testing the issuance flow first? Add `--staging` to the `certbot certonly`
> line in `init-letsencrypt.sh` to avoid Let's Encrypt rate limits, then remove
> it and re-run for the real certificate.

## Updating / redeploying

```sh
git pull
docker compose up -d --build app   # rebuild + restart only the app, zero nginx downtime
```

## Certificate renewal

The `certbot` service runs `certbot renew` every 12h (a no-op until within 30
days of expiry). nginx reloads itself every 6h to pick up a renewed cert. No
manual action needed.

## Useful commands

```sh
docker compose ps                 # status + health
docker compose logs -f app        # app logs
docker compose logs -f nginx      # proxy logs
docker compose exec nginx nginx -t # validate the rendered nginx config
docker compose down               # stop (volumes — certs — are preserved)
```

## HTTP-only variant (TLS terminated upstream)

If a load balancer / Cloudflare already terminates TLS, you don't need certbot
or the 443 block. Drop the `certbot` service, point your upstream at port 80,
and replace the template with a single `server { listen 80; ... }` that proxies
to `http://moses_app` (keep `client_max_body_size 25m` and the proxy headers).
