import { NextRequest, NextResponse } from "next/server";
import { bindInvitationToDevice } from "@/lib/invitations/storage";
import { consumeRateLimit, getClientIp } from "@/lib/security/rate-limit";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

/**
 * Verifies or binds an invitation to a client device ID.
 * Used by both live web pages and downloaded .html invitation files so that
 * any invitation transferred from a desktop to a mobile phone or from one
 * mobile phone to another phone is immediately blocked.
 */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = await consumeRateLimit(`invitation-device-check:${ip}`, {
    windowSeconds: 60,
    maxAttempts: 40,
  });
  if (!rl.allowed) {
    return NextResponse.json(
      { authorized: false, status: "rate_limited", message: "Too many verification attempts." },
      { status: 429, headers: CORS_HEADERS }
    );
  }

  let body: { invitationCode?: unknown; deviceId?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { authorized: false, status: "invalid_request" },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const invitationCode = typeof body.invitationCode === "string" ? body.invitationCode.trim() : "";
  const deviceId = typeof body.deviceId === "string" ? body.deviceId.trim() : "";

  if (!invitationCode || !deviceId) {
    return NextResponse.json(
      { authorized: false, status: "missing_params" },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const result = await bindInvitationToDevice(invitationCode, deviceId);
  return NextResponse.json(result, { status: 200, headers: CORS_HEADERS });
}
