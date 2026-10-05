# ohgeec CRM home-server deployment

This Compose project runs the private CRM and the public form receiver. The portfolio stays on GitHub Pages; do not publish the home site's source or customer data from this directory. The API accepts only constrained support requests. Directus and PostgreSQL have no public hostname.

## Before the first start

1. Use a patched Linux host with Docker Compose v2 or Podman 5 with a Compose provider, a firewall that blocks inbound WAN connections, full-disk encryption, and a separate backup destination. Install and authenticate Tailscale on the host before enabling remote admin access. Do not configure router port forwarding. Do not enter real client information until full-disk encryption and encrypted off-host backups are ready.
2. Use Cloudflare DNS for the `api.ohgeec.com` hostname (the apex `ohgeec.com` can keep serving from GitHub Pages). Create a Cloudflare Tunnel and install its token in the host's `.env`. Configure exactly one public hostname route: `api.ohgeec.com` -> `http://intake:3000`. Do not add Directus, Postgres, SSH, or the Docker socket as a public route.
3. The example pins the reviewed x86-64 image digests for Postgres, Directus, and cloudflared. Copy `.env.example` to `.env`, set a valid `ADMIN_EMAIL`, and replace every remaining placeholder. Generate independent random values for every password/secret, set `chmod 600 .env`, and keep that file outside Git backups.
4. Give the GitHub Container Registry package `ghcr.io/ohgeeceee/network-intake` read access for a dedicated host token with `read:packages` only. Log in to GHCR as the restricted deploy account (`podman login ghcr.io` for the rootless Podman host, or `docker login ghcr.io` for Docker). Do not use a self-hosted GitHub Actions runner on this server.
5. Add `api.ohgeec.com` to the allowed CORS origins only if you serve the website there; the default exact allowed origins are `https://ohgeec.com` and `https://www.ohgeec.com`.

## Start and administer

```sh
cp .env.example .env
chmod 600 .env
# Fill in .env values first.
docker compose --env-file .env -f compose.yaml config
docker compose --env-file .env -f compose.yaml up -d
```

On first initialization, Postgres creates the schema and a separate `intake_api` DB role. The intake role can execute only the `create_public_intake(...)` function; it cannot query CRM tables. The schema and role scripts run only when the `pgdata` volume is new. For an existing database, make a backup, apply `services/intake/sql/001_schema.sql` as the DB owner, then run the role creation statements from `020-create-api-role.sh` with a secure password.

Directus listens on host loopback port 8055 only. After the tailnet owner enables Tailscale Serve, proxy its HTTPS tailnet URL to `http://127.0.0.1:8055`; keep tailnet ACLs limited to your own devices. Do not expose the port on the LAN or internet. On first startup, Directus creates the admin account from `ADMIN_EMAIL` and `ADMIN_PASSWORD`. Sign in immediately over Tailscale, enable the strongest supported second factor, then remove those two bootstrap values from `.env` and recreate the Directus container. Keep the current credential in your password manager.

Directus discovers the existing tables. In its data model, create the many-to-one relationships `service_tickets.contact_id -> contacts.id`, `client_assets.contact_id -> contacts.id`, `service_events.contact_id -> contacts.id`, and `service_events.ticket_id -> service_tickets.id`. Keep the public role with no collection permissions and do not create a public Directus route. Use the admin role only through Tailscale. The `service_events` collection holds history and notes; keep new events append-only where possible. Store only password-manager references in `credential_reference`.

## Backups

Keep an encrypted off-host backup. A simple backup pattern with `age` installed on the host is:

```sh
umask 077
stamp=$(date -u +%Y%m%dT%H%M%SZ)
docker compose --env-file .env -f compose.yaml exec -T postgres pg_dump -U ohgeec_admin -Fc ohgeec \
  | age -r "$AGE_RECIPIENT" > "/srv/backups/ohgeec/crm-${stamp}.dump.age"
```

Use a public age recipient on the host; protect the private decryption identity separately from the server. Back up Directus uploads if you add file uploads. Test restoration to a separate database before entering customer data, and repeat restore checks regularly. A same-disk copy is not a disaster-recovery backup.

## Updates and rollback

The workflow publishes both an immutable `sha-<commit>` tag and a convenience `stable` tag. The host pulls the stable tag with `ops/crm/deploy.sh`, checks its container health, and keeps the prior local image tagged for rollback. The script uses rootless Podman when available and can be forced to Docker with `CONTAINER_ENGINE=docker`. Set up an update timer only after GHCR login and `.env` are ready.

For the current rootless Podman laptop host, install the user units and adjust the working path if the repository lives elsewhere:

```sh
mkdir -p ~/.config/systemd/user
cp ops/crm/ohgeec-crm-update.user.{service,timer} ~/.config/systemd/user/
systemctl --user daemon-reload
systemctl --user enable --now ohgeec-crm-update.user.timer
```

For a Docker host with the dedicated deploy account, use the system units:

```sh
sudo useradd --system --home /opt/ohgeec --shell /usr/sbin/nologin ohgeec-deploy
sudo usermod -aG docker ohgeec-deploy
# Place a clone of this repo at /opt/ohgeec/network and protect its ops/crm/.env.
sudo cp ops/crm/ohgeec-crm-update.{service,timer} /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now ohgeec-crm-update.timer
```

Membership in the Docker group is effectively root access. Protect this account and its credentials accordingly. Review GitHub Actions updates and image digests; never run PR-controlled workflows on the home machine.
