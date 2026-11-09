import { NextRequest, NextResponse } from "next/server";
import {
  verifyPassDeviceBinding,
  bindPassToMobileDevice,
  checkPassDeviceAccess,
  getPassBindingRecord,
  sendPassMobileBindingEmail,
} from "@/lib/security/device-binding";

/**
 * Mobile user agent detection helper for API routes.
 */
function isMobileUA(ua?: string): boolean {
  if (!ua) return false;
  const regex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|Silk/i;
  return regex.test(ua);
}

/**
 * POST /api/passes/bind
 * Binds a pass code to a mobile device or dispatches a mobile binding email.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { passCode, deviceId, holderName, action, email, passUrl } = body;

    // Sub-action: Email dispatch
    if (action === "send_email") {
      if (!email || !passCode) {
        return NextResponse.json(
          { success: false, error: "email and passCode are required" },
          { status: 400 },
        );
      }
      const emailRes = await sendPassMobileBindingEmail({
        email,
        passCode,
        holderName,
        passUrl,
      });
      return NextResponse.json(emailRes);
    }

    if (!passCode) {
      return NextResponse.json(
        { success: false, error: "passCode is required" },
        { status: 400 },
      );
    }

    const ua = request.headers.get("user-agent") || "";
    const isMobile = isMobileUA(ua);

    // Determine target device ID
    let targetDeviceId = (deviceId || "").trim();
    if (!targetDeviceId && isMobile) {
      targetDeviceId = `MOBILE-${crypto.randomUUID()}`;
    }

    const result = await bindPassToMobileDevice(passCode, targetDeviceId, holderName);

    if (result.success) {
      return NextResponse.json({
        success: true,
        status: result.status,
        boundDeviceId: result.boundDeviceId,
      });
    }

    return NextResponse.json(
      {
        success: false,
        status: result.status,
        boundDeviceId: result.boundDeviceId,
        error: result.error,
      },
      { status: 403 },
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * GET /api/passes/bind?passCode=...&deviceId=...
 * Checks the device binding status for a pass.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const passCode = searchParams.get("passCode") || "";
    const deviceId = searchParams.get("deviceId") || "";

    if (!passCode) {
      return NextResponse.json(
        { success: false, error: "passCode parameter is required" },
        { status: 400 },
      );
    }

    const ua = request.headers.get("user-agent") || "";
    const isMobile = isMobileUA(ua);

    const access = await checkPassDeviceAccess(passCode, deviceId, isMobile);
    const record = await getPassBindingRecord(passCode);

    return NextResponse.json({
      success: true,
      passCode,
      ...access,
      claimedAt: record?.claimedAt || null,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Internal server error" },
      { status: 500 },
    );
  }
}
