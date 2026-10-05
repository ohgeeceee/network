# Deploying ohgeec.com and the private CRM

## Public portfolio

The portfolio and support guides remain static on GitHub Pages. `.github/workflows/deploy.yml` builds the guide pages, assembles only public site files, deploys them to Pages, and builds/publishes the private intake service image to GHCR from commits to `main`. Pull requests run the static guide generator but do not publish images or deploy Pages.

To switch from the current branch-based Pages source to the workflow:

1. In the repository, open **Settings → Pages** and change **Build and deployment → Source** to **GitHub Actions**.
2. Check that the repository's custom domain is still `ohgeec.com` and HTTPS is enforced.
3. Merge the workflow to `main`. Confirm the `Build and deploy portfolio + intake API` workflow succeeds and the live site loads `book.html`, `/privacy.html`, the guide hub, and `/tech-support/onsite-montana/`.
4. The workflow excludes source content, service source, CRM operations files, and credentials from the Pages artifact. The guides and their generated HTML remain public as intended.

GitHub Actions uses GitHub-hosted runners only. It publishes `ghcr.io/ohgeeceee/network-intake:stable` and an immutable `sha-<commit>` image tag. The home server pulls the image; GitHub Actions never connects into the home network.

## DNS and public API

The portfolio stays on GitHub Pages at `ohgeec.com`. The laptop exposes only the intake API through Tailscale Funnel at `https://parrot.tail60dba7.ts.net:8443`; Directus remains private on the separate Tailscale Serve port 443. Funnel provides a tailnet hostname, not a custom `api.ohgeec.com` hostname, and does not require a router port-forward or public home IP.

The compose file binds intake to `127.0.0.1:3000`. Enable Funnel on port 8443 with `sudo tailscale funnel --bg --https=8443 --yes http://127.0.0.1:3000`. Do not route other services through Funnel. `PUBLIC_INTAKE_ENABLED` defaults to `false`; change it to `true` only after full-disk encryption and encrypted backup restoration have been verified, then recreate the intake container.

The public form sends JSON to `https://parrot.tail60dba7.ts.net:8443/v1/intake`. The receiver validates an allowlisted schema and writes the contact, ticket, and first event in one PostgreSQL function call when intake is enabled. CORS only allows the portfolio's exact origins; it is not treated as authentication. The form contains no shared secret.

## Private CRM host

Follow [ops/crm/README.md](ops/crm/README.md) on the Linux server. Directus listens on `127.0.0.1:8055`; use Tailscale Serve for the owner's tailnet access. PostgreSQL has no host port. Never expose Directus or PostgreSQL publicly and never mount the Docker socket into application containers.

The private host needs Docker Compose v2, outbound DNS/HTTPS, a Tailscale client, GHCR `read:packages` access, a protected `ops/crm/.env`, and a separate encrypted backup target. Image digests in `.env` must be set to reviewed versions before starting services. The compose stack is not live until those host-specific values, DNS, tunnel route, and initial Directus account are configured.

## Update flow

1. A merge to `main` deploys the new static site and publishes the intake container.
2. The host's systemd timer runs `ops/crm/deploy.sh` every five minutes. The script uses rootless Podman when available; the current laptop host should use the included user-level units (`ohgeec-crm-update.user.service` and `.timer`). Docker hosts can use the system-level units.
3. The deploy script pulls the `stable` image, restarts only the intake service, waits for its health check, and restores the previous local image tag if the new container does not become healthy.
4. Schema changes require an encrypted backup and a reviewed forward migration before the application image is rolled out.

For a manual update on the host, run `ops/crm/deploy.sh`. Keep deployment credentials read-only for GHCR and do not run untrusted pull-request workflows on the home server.
