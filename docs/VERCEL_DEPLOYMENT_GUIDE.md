# Vercel Production Deployment Guide
**2026 Abeokuta Polo Festival — The Blueprint**

This guide provides step-by-step instructions for deploying the platform to **Vercel** connected directly to the GitHub repository:
`https://github.com/scholarsuite25-netizen/abeokutapolofestival2026.git`

---

## 1. Quick Deployment via Vercel Dashboard

1. Navigate to [vercel.com/new](https://vercel.com/new).
2. Select **Import Git Repository** and search for `scholarsuite25-netizen/abeokutapolofestival2026`.
3. Configure the Project:
   - **Framework Preset**: Next.js (automatically detected)
   - **Root Directory**: `./` (leave default)
   - **Build Command**: `next build` (or default)
   - **Output Directory**: `.next` (default)
4. Add the **Environment Variables** (see table below).
5. Click **Deploy**.

---

## 2. Production Environment Variables Reference

Configure these variables in **Project Settings → Environment Variables** on Vercel:

| Variable Name | Environment | Value / Source |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Production | `https://your-domain.vercel.app` (or custom domain) |
| `NEXT_PUBLIC_SUPABASE_URL` | All | ``https://<project-ref>.supabase.co`` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | All | *(Supplied JWT anon public key)* |
| `SUPABASE_URL` | Production, Preview | ``https://<project-ref>.supabase.co`` |
| `SUPABASE_SERVICE_ROLE_KEY` | Production, Preview | *(Supplied JWT service_role key — server-only)* |
| `SUPABASE_DB_PASSWORD` | Production, Preview | ``«your-database-password»`` |
| `QR_SIGNING_SECRET` | Production, Preview | ``«a-long-random-string»`` |
| `ENCRYPTION_SECRET` | Production, Preview | ``«a-long-random-string»`` |
| `CRON_SECRET` | Production, Preview | ``«a-long-random-string»`` |
| `WORKER_AUTH_SECRET` | Production, Preview | ``«a-long-random-string»`` |
| `EMAILBUMP_API_KEY` | Production, Preview | ``«your-`«your-smtp-password»`-api-key»`` |
| `EMAILBUMP_PROJECT_ID` | Production, Preview | ``«your-`«your-smtp-password»`-project-id»`` |
| `EMAILBUMP_SMTP_HOST` | Production, Preview | ``«smtp.your-provider.com»`` |
| `EMAILBUMP_SMTP_PORT` | Production, Preview | `587` |
| `EMAILBUMP_SMTP_PASSWORD` | Production, Preview | ``«your-smtp-password»`` |
| `EMAIL_FROM` | Production, Preview | ``tickets@guests.abeokutapolofestival2026.org.ng`` |
| `NEXT_PUBLIC_FEATURE_HOSPITALITY_ENQUIRY` | All | `true` |

> [!IMPORTANT]
> Never set `SUPABASE_SERVICE_ROLE_KEY`, `QR_SIGNING_SECRET`, or `ENCRYPTION_SECRET` with the `NEXT_PUBLIC_` prefix. They must remain strictly `server-only`.

---

## 3. Deployment via Vercel CLI

If deploying from the terminal:

```bash
# Link to your Vercel account/team
npx vercel link

# Push environment variables from .env.local to Vercel
npx vercel env pull .env.production.local

# Deploy directly to production
npx vercel --prod
```

---

## 4. Post-Deployment Verification Checklist

1. **Public Marketing Showcase**:
   - Visit `/` and verify hero, 2025 watermark, and 5 Pillars render.
   - Visit `/royal-cup` and `/programme` to verify festival dates (18–20 Dec 2026).
2. **Registration & Pass Generation**:
   - Register a guest at `/register`.
   - Check that the cryptographic HMAC pass card is generated with a live QR code.
   - Confirm confirmation email delivery via EmailBump REST API.
3. **Turnstile Ingress PWA**:
   - Open `/scan` on mobile or desktop browser.
   - Check camera viewfinder permissions and scan/type an accredited pass token.
4. **Operations Command Centre**:
   - Visit `/admin` and `/admin/finance` to verify KPI telemetry and zero-payment compliance.
