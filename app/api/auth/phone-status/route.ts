import { NextResponse } from "next/server";
import { getPublicEnv } from "@/lib/env";

/**
 * Reports whether the project has phone sign-in switched on, so the sign-in
 * page only offers the SMS route when it can actually work.
 *
 * Supabase's auth settings are public, but the anon key is not exposed to the
 * browser, so this small server route reads them.
 */
export async function GET() {
  try {
    const env = getPublicEnv();
    const url = env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !anonKey) {
      return NextResponse.json({ phoneEnabled: false }, { status: 200 });
    }

    const res = await fetch(`${url}/auth/v1/settings`, {
      headers: { apikey: anonKey },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json({ phoneEnabled: false }, { status: 200 });
    }

    const settings = (await res.json()) as { external?: { phone?: boolean } };
    return NextResponse.json({ phoneEnabled: Boolean(settings.external?.phone) });
  } catch {
    return NextResponse.json({ phoneEnabled: false }, { status: 200 });
  }
}
