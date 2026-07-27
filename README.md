# CyberRange TZ

A browser-based cyber range for Tanzania. Students get a real Linux shell in a
disposable container, work through hands-on security labs, and capture flags.
No VM downloads, no lab setup, nothing to install.

The gap this addresses: security training in the region is mostly slideware,
because running a lab environment means every student needs a machine that can
host virtual machines. Containers move that cost to the server.

## Status

The public site is currently the waitlist and admin console. The lab runtime
runs locally through Docker Compose and is not yet exposed publicly.

| Part | State |
|---|---|
| Waitlist site and email capture | Deployed |
| Admin waitlist console | Deployed |
| Lab containers | Working locally, 6 labs built |
| In-browser terminal | Working locally over WebSocket |
| Auth, sessions, progress tracking | Backend implemented |

## Labs

| Lab | What it teaches |
|---|---|
| `linux-fundamentals` | Shell navigation, permissions, processes |
| `red` | Offensive tooling and enumeration |
| `blue` | Log analysis against a syslog source |
| `recon-ping-sweep` | Host discovery against live and filtered targets |
| `recon-detect-icmp` | Detecting the sweep from the defender's side |

The recon labs are the interesting pair. `recon-ping-sweep` gives the student an
attacker container and two targets, one that answers ICMP and one behind a
filter, so the lesson is that "no reply" is not the same as "no host".
`recon-detect-icmp` puts the student on the other side of the same traffic.

Each lab is a `Dockerfile` plus a `setup.sh` that seeds the filesystem, and a
`flag.txt` that the grader checks for.

## Architecture

```
  React + Vite client
    xterm.js terminal  ──WebSocket──┐
                                    │
  Express server ───────────────────┤  spawns / attaches
    JWT auth, rate limiting         │
    helmet, sanitize-html           ▼
    PostgreSQL  ◄──────────  per-student lab container
```

**Client** is React with React Router and Tailwind, routes lazy-loaded behind a
Suspense boundary and wrapped in an error boundary. The terminal is `@xterm/xterm`
with the fit addon.

**Server** is Express on PostgreSQL. Access and refresh tokens are separate
secrets, passwords are bcrypt-hashed, `helmet` sets the security headers,
`express-rate-limit` covers the auth routes, and all user-supplied HTML goes
through `sanitize-html` before storage.

**Labs** are ordinary container images, one per exercise, orchestrated by
Compose in development.

## Running it locally

```bash
cp .env.example .env
# fill in every CHANGE_ME value first:
#   openssl rand -hex 32
docker compose up --build
```

The compose file brings up Postgres, the backend, the frontend, and the lab
images. No secrets are committed; `.env.example` contains placeholders only.

## Layout

```
client/        React + Vite frontend
server/        Express API, WebSocket terminal bridge, Postgres access
labs/          One directory per lab: Dockerfile, setup.sh, flag
scripts/       Deck and content build helpers
docker-compose.yml
render.yaml    Deployment config
```

## Notes

This is an early-stage project and the security model for the lab containers is
still being tightened. Do not run the lab runtime on a host you care about, and
do not expose it to untrusted users in its current form.
