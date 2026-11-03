import { NextResponse } from "next/server";
import { generateProgrammeHTML } from "@/lib/pdf/programme-pdf";

export async function GET() {
  const html = generateProgrammeHTML();
  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}

