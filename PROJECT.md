# Project: Custom Domain Cloudflare DNS & Vercel Integration

## Architecture
- **Apex Domain**: `abeokutapolofestival2026.org.ng`
- **Subdomain (Canonical)**: `www.abeokutapolofestival2026.org.ng` (308 redirect target from apex)
- **Email Subdomain**: `guests.abeokutapolofestival2026.org.ng` (Resend EU-West-1 transactional emails)
- **DNS Authority**: Cloudflare DNS (Zone ID allocated under account `aed0a3ce52c51760cd46d76d616f38ce`)
- **Web Host**: Vercel (`digitalwealthcreators-projects/abeokuta-polo-festival-2026`, Project ID: `prj_UcKFQTOyc9BFfqJD8JyhSvf3hByd`)
- **Domain Registrar**: HarmonWeb (`clients.harmonweb.com`, nameserver delegation to Cloudflare)

## Feature Inventory
| # | Feature | Description | Milestone | Source | Status |
|---|---------|-------------|-----------|--------|--------|
| 1 | Cloudflare Zone Provisioning | Automate creation of `abeokutapolofestival2026.org.ng` zone on Cloudflare account via API | M1 | ORIGINAL_REQUEST §R1 | IN_PROGRESS |
| 2 | Cloudflare SSL/TLS Full Mode | Configure Cloudflare SSL encryption mode to "Full" and enable Always Use HTTPS to prevent redirect loops | M1 | ORIGINAL_REQUEST §R3 | IN_PROGRESS |
| 3 | Resend Email Records Migration | Populate Cloudflare DNS with verified Resend DKIM (TXT), SPF (2 CNAMEs), MX (10), and DMARC with DNS-only (unproxied) | M1 | ORIGINAL_REQUEST §R1 | IN_PROGRESS |
| 4 | Vercel Apex & WWW DNS Wiring | Create Cloudflare DNS records for Vercel: Apex A record (`76.76.21.21`) and WWW CNAME (`cname.vercel-dns.com`) | M2 | ORIGINAL_REQUEST §R2 | IN_PROGRESS |
| 5 | Vercel Domain Verification Trigger | Run Vercel CLI domain verification for apex and www to confirm configuration | M2 | ORIGINAL_REQUEST §R2 | IN_PROGRESS |
| 6 | Non-Coder Registrar Switch Package | Produce exact copy-paste nameserver instructions and automated propagation poller for HarmonWeb | M3 | ORIGINAL_REQUEST §R4 | IN_PROGRESS |
| 7 | End-to-End Automated DNS & HTTPS Verification | Automated suite verifying DNS resolution, HTTPS GET 200/308, SSL validity, and Resend email integrity | M4 | ORIGINAL_REQUEST §Verification | IN_PROGRESS |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Cloudflare Zone Provisioning, SSL Full & Resend DNS Migration | R1 & R3: Create Cloudflare zone, configure SSL=full, create DKIM, SPF, MX, and DMARC records | none | IN_PROGRESS |
| M2 | Vercel Custom Domain DNS Wiring & Verification | R2: Create Apex A (`76.76.21.21`) and WWW CNAME (`cname.vercel-dns.com`), trigger Vercel CLI verification | M1 | PLANNED |
| M3 | Non-Coder HarmonWeb Transition & Verification Harness | R4: Non-coder copy-paste instructions, automated nameserver & DNS resolution poller | M1, M2 | PLANNED |
| M4 | E2E Testing Suite Pass & Gate Verification Loop | End-to-end verification via automated network tools, reviewers, challengers, and forensic auditor | M1, M2, M3 | PLANNED |

## Interface Contracts & DNS Specifications

### 1. Cloudflare DNS Records Matrix
| Record Type | Name | Target / Content | Priority | TTL | Proxied |
|-------------|------|------------------|----------|-----|---------|
| `A` | `@` | `76.76.21.21` | - | 1 (auto) | `false` (DNS-only) |
| `CNAME` | `www` | `cname.vercel-dns.com` | - | 1 (auto) | `false` (DNS-only) |
| `TXT` | `resend._domainkey.guests` | `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCuMSW9RpJ2N1KHzdz7+DtquZJhlPGJjh4exnPGNZiXB+jL1PBwnQKfJuIqAW1aBGy7fZNxAp/zlCcE1R4plnGLFnqVeA3xVh0RyYvd4IJBLp4GZmmDES9CDQzPrE8mZqIbRHNq5J4LJNXy+6tM1Fbv0wLFgQ9tRzUYWIruc7+SJwIDAQAB` | - | 1 (auto) | `false` |
| `CNAME` | `rsend.guests` | `rsend-euw1.forge.rmta.net` | - | 1 (auto) | `false` |
| `CNAME` | `send.guests` | `send.forge.rmta.net` | - | 1 (auto) | `false` |
| `MX` | `guests` | `receive-euw1.forge.rmta.net` | 10 | 1 (auto) | `false` |
| `TXT` | `_dmarc` | `v=DMARC1; p=none;` | - | 1 (auto) | `false` |

### 2. Cloudflare Zone Settings
- `ssl`: `"full"` (`PATCH /zones/{zone_id}/settings/ssl`)
- `always_use_https`: `"on"` (`PATCH /zones/{zone_id}/settings/always_use_https`)
- `min_tls_version`: `"1.2"` (`PATCH /zones/{zone_id}/settings/min_tls_version`)

### 3. Vercel Verification Endpoint
- `npx vercel domains verify abeokutapolofestival2026.org.ng --scope digitalwealthcreators-projects`
- `npx vercel domains verify www.abeokutapolofestival2026.org.ng --scope digitalwealthcreators-projects`
