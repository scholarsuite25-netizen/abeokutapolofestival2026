import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePermission, PermissionError } from "@/lib/auth/require";
import { isSupabaseConfigured } from "@/lib/env";
import { DAY3_VVIP_OFFICIAL_PRICE_NGN } from "@/lib/config/checkout-config";

function toCsvRow(values: (string | number | boolean | null | undefined)[]): string {
  return values
    .map((val) => {
      if (val === null || val === undefined) return "";
      const str = String(val);
      if (/[",\n\r]/.test(str)) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    })
    .join(",");
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isSupabaseConfigured()) {
    return new NextResponse("Database not configured", { status: 503 });
  }

  try {
    await requirePermission("export.bulk");
  } catch (error) {
    if (error instanceof PermissionError) {
      return new NextResponse("Permission denied. Requires export.bulk privilege.", {
        status: 403,
      });
    }
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { id } = await params;
  const supabase = createAdminClient();

  let csvRows: string[] = [];
  let filename = `abeokuta-polo-2026-${id}.csv`;

  if (id === "turnstile-ingress") {
    filename = "abeokuta-polo-2026-turnstile-ingress.csv";
    csvRows.push(
      toCsvRow(["Timestamp", "Gate", "Pass Code", "Pass Type", "Result", "Operator Notes"]),
    );

    const { data: events } = await supabase
      .from("check_in_events")
      .select("scanned_at, gate, result, details, credentials(pass_code, pass_type)")
      .order("scanned_at", { ascending: false })
      .limit(2000);

    if (events && events.length > 0) {
      for (const e of events) {
        const cred = Array.isArray(e.credentials) ? e.credentials[0] : e.credentials;
        const passCode = cred?.pass_code || "UNKNOWN";
        const passType = cred?.pass_type || "Standard";
        const detailsStr = e.details ? JSON.stringify(e.details) : "";
        csvRows.push(
          toCsvRow([e.scanned_at, e.gate, passCode, passType, e.result, detailsStr]),
        );
      }
    }
  } else if (id === "master-roster") {
    filename = "abeokuta-polo-2026-master-accreditation.csv";
    csvRows.push(
      toCsvRow([
        "Registration ID",
        "First Name",
        "Last Name",
        "Email",
        "Phone",
        "Category",
        "Status",
        "Registration Date",
      ]),
    );

    const { data: registrations } = await supabase
      .from("registrations")
      .select("id, first_name, last_name, email, phone, category, status, created_at")
      .order("created_at", { ascending: false })
      .limit(5000);

    if (registrations && registrations.length > 0) {
      for (const r of registrations) {
        csvRows.push(
          toCsvRow([
            r.id,
            r.first_name,
            r.last_name,
            r.email,
            r.phone,
            r.category,
            r.status,
            r.created_at,
          ]),
        );
      }
    }
  } else if (id === "daily-attendance") {
    filename = "abeokuta-polo-2026-daily-attendance.csv";
    csvRows.push(
      toCsvRow(["Timestamp", "Gate", "Pass Code", "Status Result", "Scan Log"]),
    );

    const { data: events } = await supabase
      .from("check_in_events")
      .select("scanned_at, gate, result, details, credentials(pass_code)")
      .order("scanned_at", { ascending: false })
      .limit(3000);

    if (events && events.length > 0) {
      for (const e of events) {
        const cred = Array.isArray(e.credentials) ? e.credentials[0] : e.credentials;
        const passCode = cred?.pass_code || "";
        csvRows.push(
          toCsvRow([
            e.scanned_at,
            e.gate,
            passCode,
            e.result,
            e.details ? JSON.stringify(e.details) : "",
          ]),
        );
      }
    }
  } else if (id === "offline-finance") {
    filename = "abeokuta-polo-2026-finance-commitments.csv";
    csvRows.push(
      toCsvRow([
        "Entity / Reference",
        "Category / Flow",
        "Proposed / Claimed Amount NGN",
        "Confirmed Amount NGN",
        "Status",
        "Date Recorded",
      ]),
    );

    const [{ data: commitments }, { data: bankWires }] = await Promise.all([
      supabase
        .from("offline_commitments")
        .select("entity_name, tier, proposed_amount, confirmed_amount, status, created_at")
        .order("created_at", { ascending: false }),
      supabase
        .from("registrations")
        .select("first_name, last_name, category, status, created_at")
        .in("status", [
          "pending_verification",
          "pending_bank_verification",
          "confirmed",
        ])
        .order("created_at", { ascending: false }),
    ]);

    if (commitments && commitments.length > 0) {
      for (const c of commitments) {
        csvRows.push(
          toCsvRow([
            c.entity_name,
            c.tier,
            c.proposed_amount,
            c.confirmed_amount,
            c.status,
            c.created_at,
          ]),
        );
      }
    }

    if (bankWires && bankWires.length > 0) {
      for (const b of bankWires) {
        csvRows.push(
          toCsvRow([
            `${b.first_name} ${b.last_name}`,
            b.category,
            DAY3_VVIP_OFFICIAL_PRICE_NGN,
            b.status === "confirmed" ? DAY3_VVIP_OFFICIAL_PRICE_NGN : 0,
            b.status,
            b.created_at,
          ]),
        );
      }
    }
  } else {
    return new NextResponse("Unknown report ID", { status: 404 });
  }

  const csvContent = csvRows.join("\r\n");

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
