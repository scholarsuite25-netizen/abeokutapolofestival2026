"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Crown,
  Shield,
  ShieldCheck,
  Check,
  Copy,
  Download,
  Share2,
  Users,
  CreditCard,
  Building,
  Sparkles,
  ArrowRight,
  AlertTriangle,
  Info,
  Calendar,
  MapPin,
  Lock,
  Phone,
  Mail,
  User,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DAY3_TABLE_PACKAGES,
  TABLE_PACKAGE_LIST,
  getTablePackage,
  getTableSerialList,
  formatTablePriceNaira,
  type TablePackage,
} from "@/lib/config/tables-config";
import { CLUB_BANK_DETAILS, generateWemaTransferReference } from "@/lib/config/checkout-config";
import {
  initializeTablePayment,
  submitTableRegistration,
  recordAffiliateClick,
  type TableBookingResult,
} from "@/app/(public)/register/actions";
import { persistRegisteredPass, forceDownloadOfflinePassCard, type StoredPass } from "@/lib/storage/pass-storage";

export function TablesBookingClient() {
  const searchParams = useSearchParams();

  // Selection state
  const [selectedPackageId, setSelectedPackageId] = useState<string>("kings_table");
  const selectedPkg = getTablePackage(selectedPackageId) || TABLE_PACKAGE_LIST[0];

  const serials = getTableSerialList(selectedPackageId);
  const [selectedSerial, setSelectedSerial] = useState<string>(serials[0] || "Table 01");

  // Sync serial when package changes
  useEffect(() => {
    const list = getTableSerialList(selectedPackageId);
    if (list.length > 0 && !list.includes(selectedSerial)) {
      setSelectedSerial(list[0]);
    }
  }, [selectedPackageId, selectedSerial]);

  // Buyer Info
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [affiliateRef, setAffiliateRef] = useState<string>("");

  // 10 Seats: Seat 1 is Host, Seats 2 to 10 are Guests
  const [attendeeNames, setAttendeeNames] = useState<string[]>(Array(10).fill(""));

  // Payment channel: 'gateway' (online card) or 'bank_transfer' (Wema Bank)
  const [paymentChannel, setPaymentChannel] = useState<"gateway" | "bank_transfer">("gateway");
  const [wemaRef, setWemaRef] = useState<string>(() => generateWemaTransferReference());

  // UI state
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [bookingResult, setBookingResult] = useState<TableBookingResult | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Auto-sync Seat 1 name with Host name
  useEffect(() => {
    const fullName = `${firstName} ${lastName}`.trim();
    setAttendeeNames((prev) => {
      const copy = [...prev];
      copy[0] = fullName || copy[0];
      return copy;
    });
  }, [firstName, lastName]);

  // Read URL search params for return from online payment or affiliate ref
  const returnHandled = useRef(false);
  useEffect(() => {
    const refParam = searchParams.get("ref") || searchParams.get("aff");
    if (refParam) {
      const code = refParam.toUpperCase().trim();
      setAffiliateRef(code);
      recordAffiliateClick(code).catch(() => {});
      try {
        document.cookie = `abk_affiliate_ref=${encodeURIComponent(code)}; max-age=2592000; path=/; SameSite=Lax`;
      } catch {
        // Non-blocking
      }
    } else {
      try {
        const match = typeof document !== "undefined" ? document.cookie.match(/abk_affiliate_ref=([^;]+)/) : null;
        if (match && match[1]) {
          const cookieCode = decodeURIComponent(match[1]).toUpperCase().trim();
          setAffiliateRef(cookieCode);
          recordAffiliateClick(cookieCode).catch(() => {});
        }
      } catch {
        // Non-blocking
      }
    }

    const pkgParam = searchParams.get("pkg");
    if (pkgParam && DAY3_TABLE_PACKAGES[pkgParam]) {
      setSelectedPackageId(pkgParam);
    }

    const serialParam = searchParams.get("serial");
    if (serialParam) {
      setSelectedSerial(serialParam);
    }

    const fnParam = searchParams.get("fn");
    if (fnParam) setFirstName(fnParam);

    const lnParam = searchParams.get("ln");
    if (lnParam) setLastName(lnParam);

    const emParam = searchParams.get("em");
    if (emParam) setEmail(emParam);

    const phParam = searchParams.get("ph");
    if (phParam) setPhone(phParam);

    const attendeesParam = searchParams.get("attendees");
    if (attendeesParam) {
      try {
        const parsed = JSON.parse(attendeesParam);
        if (Array.isArray(parsed)) {
          setAttendeeNames((prev) => {
            const copy = [...prev];
            parsed.forEach((a: any) => {
              if (a.seat >= 1 && a.seat <= 10 && a.name) {
                copy[a.seat - 1] = a.name;
              }
            });
            return copy;
          });
        }
      } catch {
        // Non-blocking
      }
    }

    const paymentRefParam = searchParams.get("payment_ref") || searchParams.get("reference");
    if (paymentRefParam && !returnHandled.current) {
      returnHandled.current = true;
      const effectivePkgId = pkgParam || selectedPackageId;
      const effectiveSerial = serialParam || selectedSerial;
      const effectiveEmail = emParam || email;
      const effectiveFn = fnParam || firstName;
      const effectiveLn = lnParam || lastName;
      const effectivePh = phParam || phone;

      if (effectiveEmail) {
        setLoading(true);
        // Build 10 attendees payload
        const capacity = selectedPkg.guestCapacity || 10;
    const attendeesPayload = (capacity === 1)
      ? [{ seat: 1, name: `${firstName} ${lastName}`.trim() }]
      : attendeeNames.slice(0, capacity).map((name, idx) => ({
          seat: idx + 1,
          name: name.trim() || (idx === 0 ? `${effectiveFn} ${effectiveLn}`.trim() : `${effectiveFn} ${effectiveLn} (Guest ${idx + 1})`),
        }));

        submitTableRegistration({
          packageId: effectivePkgId,
          tableSerial: effectiveSerial,
          buyerFirstName: effectiveFn,
          buyerLastName: effectiveLn,
          buyerEmail: effectiveEmail,
          buyerPhone: effectivePh,
          paymentMethod: "gateway",
          paymentRef: paymentRefParam,
          affiliateCode: refParam || affiliateRef || undefined,
          attendees: attendeesPayload,
        })
          .then((res) => {
            setLoading(false);
            if (res.success) {
              setBookingResult(res);
              if (res.passes && res.passes.length > 0) {
                persistRegisteredPass(res.passes);
              }
            } else {
              setErrorMessage(res.error || "Failed to confirm table reservation.");
            }
          })
          .catch((err) => {
            setLoading(false);
            setErrorMessage((err as Error)?.message || "Failed to confirm payment.");
          });
      }
    }
  }, [searchParams]);

  // Handle form submission
  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!firstName.trim() || !lastName.trim()) {
      setErrorMessage("Please enter the Host's first and last name.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }
    if (!phone.trim()) {
      setErrorMessage("Please enter a valid WhatsApp phone number.");
      return;
    }

    const attendeesPayload = attendeeNames.map((name, idx) => ({
      seat: idx + 1,
      name: name.trim() || (idx === 0 ? `${firstName} ${lastName}`.trim() : `${firstName} ${lastName} (Guest ${idx + 1})`),
    }));

    if (paymentChannel === "gateway") {
      setLoading(true);
      const init = await initializeTablePayment({
        packageId: selectedPackageId,
        tableSerial: selectedSerial,
        buyerFirstName: firstName,
        buyerLastName: lastName,
        buyerEmail: email,
        buyerPhone: phone,
        affiliateCode: affiliateRef.trim() || undefined,
        attendees: attendeesPayload,
      });

      if (!init.success) {
        setLoading(false);
        setErrorMessage(init.error || "Failed to launch online payment gateway.");
        return;
      }

      if (init.authorization_url) {
        window.location.href = init.authorization_url;
        return;
      }
    } else {
      // Wema Bank Transfer
      setLoading(true);
      const res = await submitTableRegistration({
        packageId: selectedPackageId,
        tableSerial: selectedSerial,
        buyerFirstName: firstName,
        buyerLastName: lastName,
        buyerEmail: email,
        buyerPhone: phone,
        paymentMethod: "bank_transfer",
        bankTransferRef: wemaRef,
        affiliateCode: affiliateRef.trim() || undefined,
        attendees: attendeesPayload,
      });

      setLoading(false);
      if (res.success) {
        setBookingResult(res);
        if (res.passes && res.passes.length > 0) {
          persistRegisteredPass(res.passes);
        }
      } else {
        setErrorMessage(res.error || "Failed to register table booking.");
      }
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(label);
      setTimeout(() => setCopiedCode(null), 2500);
    } catch {
      // Non-blocking
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // VIEW: Confirmed Table Access Hub (Post-Purchase)
  // ───────────────────────────────────────────────────────────────────────────
  if (bookingResult && bookingResult.success && bookingResult.passes) {
    const isProvisional = bookingResult.status === "pending_bank_verification";
    const hostName = bookingResult.buyerName || `${firstName} ${lastName}`;

    return (
      <div className="w-full bg-[#050505] text-ivory py-10 sm:py-16 px-3 sm:px-6 lg:px-8 min-h-screen">
        <div className="mx-auto max-w-5xl space-y-8">
          {/* Header Banner (Solid Black) */}
          <div className="rounded-3xl border-2 border-gold-deep/80 bg-black p-6 sm:p-10 text-center space-y-4 shadow-2xl relative overflow-hidden">
            <div className="inline-flex items-center gap-2 rounded-full border border-gold-deep/60 bg-gold-deep/15 px-4 py-1 text-xs font-bold uppercase tracking-widest text-gold-light">
              <Crown className="size-4 text-gold-deep" />
              <span>Day 3 Grand Finale · Private Table Enclosure</span>
            </div>
            <h1 className="font-display text-2xl sm:text-4xl lg:text-5xl font-black text-ivory tracking-tight">
              Table Enclosure Confirmed!
            </h1>
            <p className="max-w-2xl mx-auto text-sm sm:text-base text-ivory/85">
              Welcome to the <strong>{bookingResult.packageName}</strong> ({bookingResult.tableSerial}). 
              All <strong>{bookingResult.passes.length} distinct VIP ID access card{bookingResult.passes.length > 1 ? "s" : ""}</strong> have been generated with cryptographic HMAC-256 signatures.
            </p>
          </div>

          {/* Golden Demarcation Line */}
          <div className="w-full my-6 sm:my-8">
            <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-gold-deep to-transparent" />
            <div className="h-px w-full bg-gold/30 mt-0.5" />
          </div>

          {/* Provisional Bursary Notice for Bank Transfers */}
          {isProvisional && (
            <div className="rounded-2xl border-2 border-amber-500 bg-amber-950/80 p-5 text-amber-100 shadow-xl space-y-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="size-6 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h3 className="font-bold text-base text-amber-300">
                    Provisional Bank Claim Slips Issued — Turnstile Admission Pending Verification
                  </h3>
                  <p className="text-xs sm:text-sm text-amber-200/90 leading-relaxed">
                    Transfer reference: <strong className="font-mono text-amber-300">{bookingResult.bankTransferRef}</strong>. 
                    Please send your transfer receipt (₦{CLUB_BANK_DETAILS.feePerTicketNgn} testing amount) to the Secretariat Bursary via WhatsApp to activate all 10 turnstile credentials before the gates open on 20 Dec 2026.
                  </p>
                  {bookingResult.secretariatNotification?.whatsappUrl && (
                    <div className="pt-2">
                      <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs">
                        <a href={bookingResult.secretariatNotification.whatsappUrl} target="_blank" rel="noopener noreferrer">
                          Send Receipt via WhatsApp →
                        </a>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Host Table Details Card */}
          <div className="rounded-2xl border border-gold/40 bg-[#1C1605] p-5 sm:p-7 shadow-2xl grid gap-6 md:grid-cols-3">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-widest text-gold-deep">Reserved Enclosure</span>
              <p className="font-display text-lg font-bold text-ivory">{bookingResult.packageName}</p>
              <p className="text-xs text-gold font-semibold">{bookingResult.tableSerial} · 10 Reserved Seats</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-widest text-gold-deep">Table Host</span>
              <p className="font-display text-lg font-bold text-ivory">{hostName}</p>
              <p className="text-xs text-ivory/70 truncate">{bookingResult.buyerEmail}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-widest text-gold-deep">Grand Finale Date</span>
              <p className="font-display text-lg font-bold text-ivory">Sunday, 20 Dec 2026</p>
              <p className="text-xs text-ivory/70">Abeokuta Polo Club & Country Resort</p>
            </div>
          </div>

          {/* Anti-Forwarding Notice */}
          <div className="rounded-xl border border-gold/30 bg-gold/5 p-4 flex items-start gap-3">
            <Lock className="size-5 text-gold shrink-0 mt-0.5" />
            <div className="text-xs text-ivory/90 space-y-0.5">
              <p className="font-bold text-gold">Security Protocol: Anti-Forwarding & Device-Binding</p>
              <p className="text-ivory/80 leading-relaxed">
                As the Table Host, you hold master access to all 10 cards below. When you share a guest card via WhatsApp or link, the recipient's phone will lock to that specific ticket upon opening. Third-party forwarding is strictly blocked at the turnstiles.
              </p>
            </div>
          </div>

          {/* Grid of 10 Passes */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl sm:text-2xl font-bold text-ivory flex items-center gap-2">
                <Users className="size-5 text-gold" />
                <span>10 Table Access Passes ({bookingResult.tableSerial})</span>
              </h2>
              <Badge className="bg-gold text-black font-bold text-xs uppercase px-2.5 py-0.5">
                All 10 Passes Active
              </Badge>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
              {bookingResult.passes.map((pass, idx) => {
                const isHost = idx === 0;
                const guestName = pass.holderName;
                const passUrl = typeof window !== "undefined"
                  ? `${window.location.origin}/pass/${pass.passCode}`
                  : `https://abeokuta-polo-festival-2026.vercel.app/pass/${pass.passCode}`;

                const whatsappText = `👑 *Official VIP Invitation: Abeokuta Polo Festival 2026 Grand Finale*\n\nDear ${guestName},\nYou are cordially invited to join our private VIP table enclosure:\n🏆 *${bookingResult.packageName}*\n📍 *Table:* ${bookingResult.tableSerial} (Seat ${idx + 1} of 10)\n📅 *Date:* Sunday, 20 Dec 2026\n👤 *Host:* ${hostName}\n\n🛡️ *Claim your official Gate Turnstile Access Card:*\n👉 ${passUrl}\n\n_Note: Once opened, this access pass binds to your mobile device and cannot be forwarded._`;
                const whatsappHref = `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappText)}`;

                return (
                  <div
                    key={pass.passCode}
                    className="rounded-xl border border-gold/30 bg-[#120E03] p-4 flex flex-col justify-between space-y-3 hover:border-gold transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[10px] font-bold text-gold uppercase px-1.5 py-0.5 rounded bg-gold/15 border border-gold/30">
                            Seat {idx + 1} of 10
                          </span>
                          {isHost && (
                            <Badge className="bg-neutral-800 text-gold border border-gold/40 text-[9px] font-bold uppercase">
                              Host Pass
                            </Badge>
                          )}
                        </div>
                        <h3 className="font-display text-base font-bold text-ivory pt-1">
                          {guestName}
                        </h3>
                        <p className="font-mono text-xs text-gold/80">{pass.passCode}</p>
                      </div>

                      <div className="size-10 rounded-lg bg-gold/10 border border-gold/30 flex items-center justify-center shrink-0">
                        <Crown className="size-5 text-gold" />
                      </div>
                    </div>

                    <div className="text-[11px] text-ivory/70 border-t border-gold/10 pt-2 flex items-center justify-between">
                      <span>{bookingResult.tableSerial}</span>
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        <ShieldCheck className="size-3" /> Anti-Forwarding Active
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        asChild
                        size="sm"
                        className="bg-gold-deep hover:bg-gold-light text-black font-bold text-xs h-8 flex-1 shadow-sm border border-gold-deep"
                      >
                        <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
                          <Share2 className="mr-1.5 size-3.5" /> Share WhatsApp
                        </a>
                      </Button>

                      <Button
                        onClick={() => copyToClipboard(passUrl, pass.passCode)}
                        variant="outline"
                        size="sm"
                        className="border-gold-deep bg-gold-deep/20 text-gold-light hover:bg-gold-deep hover:text-black font-bold text-xs h-8 px-2.5 transition-colors"
                        title="Copy Pass Link"
                      >
                        {copiedCode === pass.passCode ? (
                          <Check className="size-3.5 text-black" />
                        ) : (
                          <Copy className="size-3.5" />
                        )}
                      </Button>

                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="border-gold-deep/60 bg-black/60 text-gold-light hover:bg-gold-deep hover:text-black font-bold text-xs h-8 px-2.5 transition-colors"
                        title="View Full Access Card"
                      >
                        <Link href={`/pass/${pass.passCode}`}>
                          <ExternalLink className="size-3.5" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Golden Demarcation Line */}
          <div className="w-full my-6 sm:my-8">
            <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-gold-deep to-transparent" />
            <div className="h-px w-full bg-gold/30 mt-0.5" />
          </div>

          {/* Bottom Actions */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-6 border-t border-gold/20">
            <Button
              onClick={() => {
                bookingResult.passes?.forEach((p) => forceDownloadOfflinePassCard(p));
              }}
              className="bg-gold-deep text-black font-black hover:bg-gold-light shadow-md px-6 py-3 text-sm border border-gold-deep"
            >
              <Download className="mr-2 size-4" /> Download All {bookingResult.passes?.length || 1} Offline ID Card{bookingResult.passes?.length === 1 ? "" : "s"}
            </Button>

            <Button
              asChild
              className="bg-gold-deep text-black font-bold hover:bg-gold-light shadow-md px-5 py-3 text-sm border border-gold-deep"
            >
              <Link href="/pass/lookup">Pass Lookup Hub</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // VIEW: Interactive Table Selection & Booking Form
  // ───────────────────────────────────────────────────────────────────────────
  return (
    <div className="w-full bg-black text-ivory py-10 sm:py-16 px-3 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-10 sm:space-y-12">
        {/* Hero Section - Solid Black Luxury Card */}
        <div className="rounded-3xl border-2 border-gold-deep/80 bg-black p-6 sm:p-12 text-center space-y-5 max-w-4xl mx-auto shadow-2xl relative overflow-hidden">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold-deep/80 bg-gold-deep/20 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-gold shadow-sm">
            <Crown className="size-4 text-gold" />
            <span>Day 3 Grand Finale · Sunday 20 December 2026</span>
          </div>

          <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl font-black text-ivory tracking-tight leading-tight">
            Exclusive VIP Table Packages
          </h1>

          <p className="text-sm sm:text-base text-ivory/80 leading-relaxed max-w-2xl mx-auto">
            Reserve a dedicated, serial-numbered private table for 10 guests. Experience pitch-side championship polo, royal hospitality, fine dining, and live musical headline concerts in Abeokuta.
          </p>

          {/* Active Pilot Testing Mode Banner */}
          <div className="rounded-xl border border-gold-deep/80 bg-[#0d0d0d] p-4 text-center shadow-lg max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-2 text-xs sm:text-sm font-black text-gold uppercase tracking-wider">
              <Sparkles className="size-4 text-gold shrink-0 animate-pulse" />
              <span>Active Pilot Testing Mode — ₦100.00 Checkout</span>
            </div>
            <p className="text-[11px] sm:text-xs text-ivory/90 mt-1 leading-snug">
              Official package values (₦10,000,000 to ₦1,500,000) are preserved on all credentials and hospitality enclosures. For live end-to-end testing, transactions are charged at a nominal <strong>₦100.00</strong> fee.
            </p>
          </div>
        </div>

        {/* Golden Demarcation Line */}
        <div className="w-full my-6 sm:my-10">
          <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-gold-deep to-transparent" />
          <div className="h-px w-full bg-gold/40 mt-0.5" />
        </div>

        {/* 1. Category Selection Cards */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-ivory flex items-center gap-2">
              <Shield className="size-5 text-gold" />
              <span>Step 1: Choose Your Enclosure Package</span>
            </h2>
            <span className="text-xs text-gold-deep font-semibold">VIP Table Enclosures &amp; Individual Options</span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {TABLE_PACKAGE_LIST.map((pkg) => {
              const isSelected = selectedPackageId === pkg.id;
              return (
                <div
                  key={pkg.id}
                  onClick={() => setSelectedPackageId(pkg.id)}
                  className={`rounded-2xl border-2 p-5 cursor-pointer transition-all flex flex-col justify-between relative ${
                    isSelected
                      ? "border-gold bg-[#1C1605] shadow-[0_4px_25px_rgba(201,168,76,0.3)] scale-[1.02]"
                      : "border-line/40 bg-neutral-900 hover:border-gold/50 hover:bg-neutral-800"
                  }`}
                >
                  {isSelected && (
                    <div className="absolute -top-3 right-4 bg-gold text-black text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-md">
                      Selected
                    </div>
                  )}

                  <div className="space-y-3">
                    <Badge
                      className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 border ${
                        isSelected
                          ? "bg-gold/20 text-gold border-gold/40"
                          : "bg-neutral-800 text-ivory border-line/40"
                      }`}
                    >
                      {pkg.badge}
                    </Badge>

                    <div>
                      <h3 className="font-display text-lg font-bold text-ivory">{pkg.name}</h3>
                      <p className="text-[11px] text-ivory/70 leading-tight mt-0.5">{pkg.tagline}</p>
                    </div>

                    <div className="pt-2 border-t border-line/30 space-y-0.5">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-gold-deep block">
                        Official Value
                      </span>
                      <p className="font-display text-xl font-black text-gold">
                        {pkg.officialPriceDisplay}
                      </p>
                      <div className="inline-block bg-emerald-950/80 border border-emerald-500/50 rounded px-1.5 py-0.5 text-[9px] font-bold text-emerald-300">
                        Test Fee: {pkg.testingPriceDisplay}
                      </div>
                    </div>

                    <ul className="space-y-1.5 pt-2 text-[11px] text-ivory/80">
                      {pkg.features.slice(0, 3).map((f, i) => (
                        <li key={i} className="flex items-start gap-1.5 leading-snug">
                          <CheckCircle2 className="size-3 text-gold shrink-0 mt-0.5" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-4 border-t border-line/20 mt-4 flex items-center justify-between text-xs">
                    <span className="text-ivory/60 font-medium">{pkg.tableCount} Available Tables</span>
                    <span className="font-bold text-gold flex items-center gap-1">
                      {isSelected ? "Active ✓" : "Select →"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Golden Demarcation Line */}
        <div className="w-full my-6 sm:my-8">
          <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-gold-deep to-transparent" />
          <div className="h-px w-full bg-gold/30 mt-0.5" />
        </div>

        {/* 2. Serial Table Number Selection */}
        <div className="rounded-2xl border border-gold/40 bg-neutral-900 p-5 sm:p-7 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-lg sm:text-xl font-bold text-ivory flex items-center gap-2">
                <Crown className="size-5 text-gold" />
                <span>Step 2: Select Serial Table Number</span>
              </h2>
              <p className="text-xs text-ivory/70">
                Choose your specific numbered table for <strong>{selectedPkg.name}</strong> ({selectedPkg.enclosure})
              </p>
            </div>
            <Badge className="bg-gold text-black font-bold text-xs uppercase self-start sm:self-auto">
              {selectedPkg.guestCapacity === 1 ? "1 Reserved Seat" : "10 Seats Guaranteed"}
            </Badge>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {serials.map((serial) => {
              const isSerialSelected = selectedSerial === serial;
              return (
                <button
                  type="button"
                  key={serial}
                  onClick={() => setSelectedSerial(serial)}
                  className={`rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer border ${
                    isSerialSelected
                      ? "bg-gold-deep text-black border-gold-deep shadow-md scale-105"
                      : "bg-neutral-950 text-ivory/90 border-line/60 hover:border-gold-deep hover:text-gold"
                  }`}
                >
                  {serial}
                </button>
              );
            })}
          </div>
        </div>

        {/* Golden Demarcation Line */}
        <div className="w-full my-6 sm:my-8">
          <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-gold-deep to-transparent" />
          <div className="h-px w-full bg-gold/30 mt-0.5" />
        </div>

        {/* 3. Attendee Personalization (10 Seats) & Checkout Form */}
        <form onSubmit={handleSubmitBooking} className="rounded-2xl border-2 border-gold/50 bg-[#1C1605] p-5 sm:p-8 space-y-8 shadow-2xl">
          <div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-ivory flex items-center gap-2">
              <User className="size-5 text-gold" />
              <span>Step 3: {selectedPkg.guestCapacity === 1 ? "Attendee Details & VIP Table Seat (1 Guest)" : "Host Details & Guest Information (10 Seats)"}</span>
            </h2>
            <p className="text-xs text-ivory/70 mt-1">
              {selectedPkg.guestCapacity === 1 ? "At buying point, enter the primary attendee details. 1 distinct HMAC-256 signed VIP Table Turnstile ID card will be issued." : "At buying point, enter the names for all 10 attendees. Seat 1 is reserved for the Host/Buyer. Seats 2 to 10 are for your invited guests."}
            </p>
          </div>

          {/* Error Notice */}
          {errorMessage && (
            <div className="rounded-xl border border-red-500 bg-red-950/80 p-3.5 text-red-200 text-xs flex items-start gap-2.5">
              <AlertTriangle className="size-4 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Host Contact Information */}
          <div className="space-y-4">
            <h3 className="text-xs uppercase font-bold tracking-widest text-gold border-b border-gold/30 pb-1.5">
              Table Host / Primary Buyer Contact
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="fn" className="text-xs font-semibold text-ivory">Host First Name *</Label>
                <Input
                  id="fn"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="e.g. Adeyemi"
                  className="bg-neutral-950 border-line text-ivory focus:border-gold"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ln" className="text-xs font-semibold text-ivory">Host Last Name *</Label>
                <Input
                  id="ln"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="e.g. Balogun"
                  className="bg-neutral-950 border-line text-ivory focus:border-gold"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="em" className="text-xs font-semibold text-ivory">Email Address (For Confirmation & Receipts) *</Label>
                <Input
                  id="em"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. balogun@estate.com"
                  className="bg-neutral-950 border-line text-ivory focus:border-gold"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ph" className="text-xs font-semibold text-ivory">WhatsApp Phone Number *</Label>
                <Input
                  id="ph"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 0803 123 4567"
                  className="bg-neutral-950 border-line text-ivory focus:border-gold"
                />
              </div>
            </div>
          </div>

          {/* Seats Attendee List */}
          {selectedPkg.guestCapacity > 1 && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gold/30 pb-1.5">
              <h3 className="text-xs uppercase font-bold tracking-widest text-gold">
                Table Seating List (10 Passes Issued)
              </h3>
              <span className="text-[11px] text-ivory/60">
                You can personalize now or share blank guest invitations later
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {attendeeNames.map((name, idx) => {
                const isHost = idx === 0;
                return (
                  <div key={idx} className="space-y-1">
                    <Label className="text-[11px] font-semibold text-ivory/90 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <span className="font-mono text-[10px] px-1 rounded bg-gold/20 text-gold">
                          Seat {idx + 1}
                        </span>
                        <span>{isHost ? "Table Host (You)" : `Invited Guest ${idx + 1}`}</span>
                      </span>
                      {isHost && <span className="text-[10px] text-gold font-bold">Buyer</span>}
                    </Label>
                    <Input
                      value={name}
                      disabled={isHost}
                      onChange={(e) => {
                        const copy = [...attendeeNames];
                        copy[idx] = e.target.value;
                        setAttendeeNames(copy);
                      }}
                      placeholder={isHost ? `${firstName} ${lastName}` || "Host Full Name" : `Guest ${idx + 1} Full Name (e.g. Otunba K. Cole)`}
                      className={`text-xs h-9 ${
                        isHost
                          ? "bg-gold/10 border-gold/50 text-gold font-bold cursor-not-allowed"
                          : "bg-neutral-950 border-line text-ivory focus:border-gold"
                      }`}
                    />
                  </div>
                );
              })}
            </div>
          </div>
          )}

          {/* Golden Demarcation Line */}
          <div className="w-full my-4">
            <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-gold-deep to-transparent" />
            <div className="h-px w-full bg-gold/30 mt-0.5" />
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-4 pt-2">
            <h3 className="text-xs uppercase font-bold tracking-widest text-gold border-b border-gold/30 pb-1.5">
              Step 4: Select Payment Channel (Pilot Testing Fee: ₦100.00)
            </h3>

            <div className="grid gap-3 sm:grid-cols-2">
              {/* Option 1: Online Gateway */}
              <button
                type="button"
                onClick={() => setPaymentChannel("gateway")}
                className={`rounded-xl p-4 text-left border-2 transition-all cursor-pointer ${
                  paymentChannel === "gateway"
                    ? "border-gold bg-gold/15 shadow-md"
                    : "border-line/40 bg-neutral-950 hover:border-gold/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-ivory flex items-center gap-2">
                    <CreditCard className="size-4 text-gold" />
                    <span>Instant Online Payment</span>
                  </span>
                  {paymentChannel === "gateway" && <CheckCircle2 className="size-4 text-gold" />}
                </div>
                <p className="text-xs text-ivory/70 mt-1.5">
                  Debit / Credit Card, Bank Transfer, Apple Pay, USSD. Instant activation and immediate issuance of all 10 turnstile passes.
                </p>
                <span className="inline-block mt-2 font-mono text-xs font-bold text-gold">
                  Charged: ₦100.00 (Pilot Testing)
                </span>
              </button>

              {/* Option 2: WEMA Bank Direct Wire */}
              <button
                type="button"
                onClick={() => setPaymentChannel("bank_transfer")}
                className={`rounded-xl p-4 text-left border-2 transition-all cursor-pointer ${
                  paymentChannel === "bank_transfer"
                    ? "border-gold bg-gold/15 shadow-md"
                    : "border-line/40 bg-neutral-950 hover:border-gold/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-ivory flex items-center gap-2">
                    <Building className="size-4 text-gold" />
                    <span>Direct WEMA Bank Transfer</span>
                  </span>
                  {paymentChannel === "bank_transfer" && <CheckCircle2 className="size-4 text-gold" />}
                </div>
                <p className="text-xs text-ivory/70 mt-1.5">
                  Direct wire to Abeokuta Polo Club ({CLUB_BANK_DETAILS.accountNumber}). Issues Provisional Claim Slips with turnstiles activated upon Bursary verification.
                </p>
                <span className="inline-block mt-2 font-mono text-xs font-bold text-gold">
                  Transfer Amount: ₦100.00
                </span>
              </button>
            </div>

            {/* Wema Bank Details Panel */}
            {paymentChannel === "bank_transfer" && (
              <div className="rounded-xl border border-gold/50 bg-neutral-900 p-4 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gold uppercase text-[10px] tracking-wider">Abeokuta Polo Club Official Account</span>
                  <span className="font-mono font-bold text-amber-300">Reference: {wemaRef}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 font-mono text-xs">
                  <div>
                    <span className="text-[10px] text-ivory/60 block">Bank Name</span>
                    <strong className="text-ivory">{CLUB_BANK_DETAILS.bankName}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-ivory/60 block">Account Number</span>
                    <strong className="text-gold text-sm">{CLUB_BANK_DETAILS.accountNumber}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-ivory/60 block">Account Name</span>
                    <strong className="text-ivory">{CLUB_BANK_DETAILS.accountName}</strong>
                  </div>
                </div>
                <p className="text-[11px] text-ivory/80 pt-1 leading-snug">
                  * Please use transfer reference <strong className="text-gold font-mono">{wemaRef}</strong> in your payment narration.
                </p>
              </div>
            )}
          </div>

          {/* Booking Summary Box */}
          <div className="rounded-xl border border-gold/40 bg-neutral-950 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-gold-deep tracking-wider">Reservation Summary</span>
              <p className="font-display text-base font-bold text-ivory">
                {selectedPkg.name} ({selectedSerial})
              </p>
              <p className="text-xs text-ivory/70">
                {selectedPkg.guestCapacity === 1 ? "1 VIP ID Turnstile Pass" : "10 VIP ID Turnstile Passes"} · {selectedPkg.enclosure} · Sunday 20 Dec 2026
              </p>
            </div>

            <div className="text-right sm:text-right space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-ivory/60 block">Amount Payable (Testing)</span>
              <span className="font-display text-2xl font-black text-gold">₦100.00</span>
              <span className="text-[10px] text-ivory/60 block line-through">
                Official: {selectedPkg.officialPriceDisplay}
              </span>
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-2">
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gold-deep text-black hover:bg-gold-light font-display text-base font-black py-6 rounded-xl shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2 border-2 border-gold-deep"
            >
              {loading ? (
                <span>Processing Table Reservation...</span>
              ) : paymentChannel === "gateway" ? (
                <>
                  <CreditCard className="size-5" />
                  <span>Proceed to Online Checkout (₦100.00) →</span>
                </>
              ) : (
                <>
                  <Building className="size-5" />
                  <span>Confirm Bank Transfer &amp; Issue {selectedPkg.guestCapacity === 1 ? "Pass" : "10 Passes"} (₦100.00) →</span>
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Golden Demarcation Line */}
        <div className="w-full my-6">
          <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-gold-deep to-transparent" />
          <div className="h-px w-full bg-gold/30 mt-0.5" />
        </div>

        {/* Individual Pass Fallback link */}
        <div className="text-center pt-2 space-y-3">
          <p className="text-xs text-ivory/80">
            Looking for individual tickets instead of a table for 10?
          </p>
          <Button asChild className="bg-gold-deep hover:bg-gold-light text-black font-bold border border-gold-deep text-xs px-6 py-2.5 shadow-md">
            <Link href="/register">
              Go to General Registration & Individual Day 3 VVIP Passes (₦50,000 / ₦100) →
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
