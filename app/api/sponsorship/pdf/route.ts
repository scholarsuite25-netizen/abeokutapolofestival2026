import { NextResponse } from "next/server";
import { generateSponsorshipHTML } from "@/lib/pdf/sponsorship-pdf";

export async function GET() {
  const html = generateSponsorshipHTML();
  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
