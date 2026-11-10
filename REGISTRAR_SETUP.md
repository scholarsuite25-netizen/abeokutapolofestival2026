# HarmonWeb Domain Setup Guide — Abeokuta Polo Festival 2026

**Domain**: `abeokutapolofestival2026.org.ng`  
**Live Application**: `https://abeokuta-polo-festival-2026.vercel.app`  
**Vercel Scope**: `digitalwealthcreators-projects`  
**Audience**: Non-Coder / Business Owner / Platform Administrator  

---

> ### ⚡ STRONGLY RECOMMENDED PATH: Option 1 (Fast-Track)
> **If you want your website live right now with zero technical complexity, follow Option 1 below.**
>
> * **⏱️ Speed**: Takes **2 minutes** flat.
> * **🚀 Zero Propagation Wait**: Takes effect immediately without waiting 2 to 24 hours for registry nameserver delegation.
> * **🛡️ 100% Email Protection**: Guaranteed **zero disruption** to your active Resend transactional email system (`guests.abeokutapolofestival2026.org.ng`), ensuring ticket passes, receipt emails, and QR codes continue delivering flawlessly.
> * **🔑 Zero API Hassle**: No Cloudflare accounts, API tokens, or command-line permissions required.

---

## Comparison of Available Options

| Feature | Option 1: Fast-Track (Recommended) | Option 2: Cloudflare Nameserver Delegation |
|---|---|---|
| **Where to Make Changes** | HarmonWeb Client Area only | Cloudflare Dashboard & HarmonWeb |
| **Time to Complete** | 2 minutes | 15–30 minutes + propagation wait |
| **Nameserver Propagation Delay** | **Zero delay** (instant) | 2 to 24 hours (.org.ng registry delay) |
| **Resend Email Safety** | **100% Protected** (records untouched) | Requires replicating all 4 email records |
| **Vercel SSL Encryption** | Automatic via Vercel Edge (Let's Encrypt / DigiCert) | Managed via Cloudflare Edge (SSL Mode: Full) |
| **Technical Difficulty** | Non-coder friendly (copy-paste 2 values) | Intermediate (requires terminal & API token) |

---

## Option 1: Fast-Track (Update 2 Records in HarmonWeb — 2 Mins)

HarmonWeb already hosts your DNS and your verified Resend email records (`guests.abeokutapolofestival2026.org.ng`). By updating only the two web records below, your official website goes live immediately.

### Step-by-Step Instructions:
1. Log in to your **HarmonWeb Client Area**: [https://clients.harmonweb.com](https://clients.harmonweb.com).
2. Go to **Domains** -> **My Domains** and click **Manage Domain** next to `abeokutapolofestival2026.org.ng`.
3. In the left or top navigation menu, click **DNS Management** (or **Manage DNS Zone**).
4. Update the following two records:

#### Record 1: The Apex Website (A Record)
* **Record Type**: `A`
* **Name / Host**: `@` (or leave blank / `abeokutapolofestival2026.org.ng`)
* **TTL**: `14400` (or `Auto` / `Default`)
* **Current Value**: `162.19.227.132`
* **NEW Target IP (Copy & Paste)**:
  ```text
  76.76.21.21
  ```
  *(Alternative Vercel Anycast IP: `216.198.79.1`)*

#### Record 2: The WWW Subdomain (CNAME Record)
* **Record Type**: `CNAME`
* **Name / Host**: `www`
* **TTL**: `14400` (or `Auto` / `Default`)
* **Current Value**: `abeokutapolofestival2026.org.ng`
* **NEW Target Address (Copy & Paste)**:
  ```text
  cname.vercel-dns.com
  ```

5. Click **Save Changes** (or **Save DNS Records**).
6. **Done!** Your website will immediately connect to Vercel and Vercel will issue your SSL certificate automatically.

---

## Option 2: Cloudflare Nameserver Delegation Track

If your organization requires Cloudflare for DDoS protection and edge caching, use this track:

### Step 1: Add Site to Cloudflare
1. Log in to Cloudflare: [https://dash.cloudflare.com](https://dash.cloudflare.com).
2. Click **+ Add a Domain** (or **Add Site**).
3. Type: `abeokutapolofestival2026.org.ng` and select the **Free Plan** ($0).
4. Cloudflare will scan your existing records and display your **2 assigned Cloudflare Nameservers**:
   * Example:
     ```text
     ns1.cloudflare.com
     ns2.cloudflare.com
     ```
   *(Copy the exact two nameservers shown on your screen).*

### Step 2: Run the Automated Provisioning Script
The automated provisioning script populates all 7 required records (Apex A, WWW CNAME, Resend DKIM TXT, Resend SPF CNAME 1, Resend SPF CNAME 2, Resend Inbound MX, and DMARC TXT) and configures SSL Mode to Full.

Choose your operating system terminal below:

#### Windows (PowerShell)
```powershell
$env:CLOUDFLARE_API_TOKEN="your_token_here"
node scripts/setup-cloudflare-dns.mjs
```

#### Windows (Command Prompt / CMD)
```cmd
set CLOUDFLARE_API_TOKEN="your_token_here"
node scripts/setup-cloudflare-dns.mjs
```

#### macOS / Linux (Terminal / Bash)
```bash
export CLOUDFLARE_API_TOKEN="your_token_here"
node scripts/setup-cloudflare-dns.mjs
```

> **💡 Non-Coder Tip**: Alternatively, you can simply paste `CLOUDFLARE_API_TOKEN=your_token_here` into your `.env.local` file. The script will automatically detect and load it without running terminal environment commands.
>
> *Note on API Token Permissions*: If creating a token in Cloudflare, ensure it has `Zone: Read, Zone: Edit, DNS: Edit` permissions.

This script automatically provisions all 7 required DNS records:
* Apex A -> `76.76.21.21` (DNS-only)
* WWW CNAME -> `cname.vercel-dns.com` (DNS-only)
* Resend DKIM TXT -> `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCuMSW9RpJ2N1KHzdz7+DtquZJhlPGJjh4exnPGNZiXB+jL1PBwnQKfJuIqAW1aBGy7fZNxAp/zlCcE1R4plnGLFnqVeA3xVh0RyYvd4IJBLp4GZmmDES9CDQzPrE8mZqIbRHNq5J4LJNXy+6tM1Fbv0wLFgQ9tRzUYWIruc7+SJwIDAQAB`
* Resend SPF 1 CNAME -> `rsend-euw1.forge.rmta.net`
* Resend SPF 2 CNAME -> `send.forge.rmta.net`
* Resend Inbound MX -> `receive-euw1.forge.rmta.net` (Priority: 10)
* DMARC TXT -> `v=DMARC1; p=none;`
* Automatically sets Cloudflare SSL Mode to **Full** and enables **Always Use HTTPS**.

### Step 3: Switch Nameservers at HarmonWeb
1. In HarmonWeb, go to **Domains** -> **Manage Domain (`abeokutapolofestival2026.org.ng`)**.
2. Click **Nameservers** in the left menu.
3. Select **Use Custom Nameservers (enter below)**.
4. Replace `dns1.harmonweb.net` and `dns2.harmonweb.net` with the two Cloudflare nameservers from Step 1.
5. Click **Change Nameservers**.

---

## 🔍 How to Verify Everything Works

You don't need any complex diagnostic tools. Our automated verification suite auto-loads your local credentials and checks all systems:

```bash
node scripts/verify-dns-e2e.mjs
```

You can also trigger Vercel verification directly at any time:
```bash
npx vercel domains verify abeokutapolofestival2026.org.ng --scope digitalwealthcreators-projects
npx vercel domains verify www.abeokutapolofestival2026.org.ng --scope digitalwealthcreators-projects
```

### Expected Live Status:
* `https://abeokutapolofestival2026.org.ng` loads the 2026 Abeokuta Polo Festival platform with a valid padlock (SSL).
* `https://www.abeokutapolofestival2026.org.ng` redirects seamlessly to the canonical domain.
* `guests.abeokutapolofestival2026.org.ng` delivers transactional emails and QR passes without disruption.
