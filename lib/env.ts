import { z } from "zod";

/**
 * Environment contract. Names only — values live in `.env.local` / Vercel env.
 *
 * NOTE: this module is imported by both server and client code (`getPublicEnv`
 * is safe client-side — Next only inlines `NEXT_PUBLIC_*`). Secret reads go
 * through `requireServerEnv()`, whose callers must live in `server-only`
 * modules (see lib/supabase/admin.ts). Never print its result.
 *
 * `NEXT_PUBLIC_*` values are inlined at build time; everything else must stay secret.
 */
const serverSchema = z.object({
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  SUPABASE_DB_PASSWORD: z.string().min(1).optional(),
  QR_SIGNING_SECRET: z.string().min(32).optional(),
  ENCRYPTION_SECRET: z.string().min(32).optional(),
  CRON_SECRET: z.string().min(16).optional(),
  WORKER_AUTH_SECRET: z.string().min(16).optional(),
  RESEND_API_KEY: z.string().min(1).optional(),
  EMAILBUMP_API_KEY: z.string().min(1).optional(),
  EMAILBUMP_PROJECT_ID: z.string().optional(),
  EMAILBUMP_SMTP_HOST: z.string().optional(),
  EMAILBUMP_SMTP_PORT: z.string().optional(),
  EMAILBUMP_SMTP_PASSWORD: z.string().optional(),
  EMAIL_FROM: z.string().min(1).optional(),
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
});

const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
  NEXT_PUBLIC_FEATURE_HOSPITALITY_ENQUIRY: z
    .enum(["true", "false"])
    .default("true")
    .optional(),
});

export type PublicEnv = z.infer<typeof publicSchema>;

/** Server-side env, validated on first call. Throws a readable error if incomplete. */
export function requireServerEnv() {
  const parsed = serverSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid server environment:\n${issues}`);
  }
  return parsed.data;
}

/** Public env — safe to read anywhere. Missing values are tolerated during scaffold. */
export function getPublicEnv(): PublicEnv {
  const parsed = publicSchema.safeParse(process.env);
  return parsed.success ? parsed.data : {};
}

/** True when a complete Supabase pair is configured (used to soft-disable data features). */
export function isSupabaseConfigured(): boolean {
  const pub = getPublicEnv();
  return Boolean(
    pub.NEXT_PUBLIC_SUPABASE_URL &&
      pub.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}
