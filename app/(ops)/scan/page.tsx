"use client";

import { useState } from "react";
import Link from "next/link";
import {
  QrCode,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Camera,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { processGateScan, type ScanResult } from "./actions";

export default function GateScanPage() {
  const [gate, setGate] = useState("Gate 2 - General Turnstiles");
  const [passInput, setPassInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<ScanResult | null>(null);
  const [stats, setStats] = useState({ total: 0, admitted: 0, duplicate: 0, rejected: 0 });

  const handleScan = async (codeToScan: string) => {
    if (!codeToScan.trim()) return;
    setLoading(true);

    const res = await processGateScan({
      passIdentifier: codeToScan.trim(),
      gate,
    });

    setLoading(false);
    setLastResult(res);

    setStats((prev) => ({
      total: prev.total + 1,
      admitted: res.result === "admitted" ? prev.admitted + 1 : prev.admitted,
      duplicate: res.result === "already_admitted" ? prev.duplicate + 1 : prev.duplicate,
      rejected: res.result === "rejected" ? prev.rejected + 1 : prev.rejected,
    }));
  };

  const simulateSampleScan = (sampleCode: string) => {
    setPassInput(sampleCode);
    handleScan(sampleCode);
  };

  return (
    <div className="flex w-full min-h-[calc(100vh-80px)] flex-col bg-forest-deep text-ivory p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-4xl w-full space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-ivory/20 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <Badge variant="outline" className="border-gold/50 bg-gold/10 text-gold text-[10px] uppercase tracking-wider">
                Access Control Protocol · Live
              </Badge>
            </div>
            <h1 className="mt-1 font-display text-2xl font-semibold sm:text-3xl text-ivory">
              Security Gate Scanner
            </h1>
            <p className="text-xs text-ivory/60">
              Abeokuta Polo Club Grounds · Real-Time Check-In PWA
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            <Link
              href="/scan/history"
              className="inline-flex items-center gap-1.5 rounded-md border border-gold/40 bg-gold/15 px-3 py-2 text-xs font-semibold text-gold transition-colors hover:bg-gold/25"
            >
              <Clock className="h-3.5 w-3.5" />
              <span>Ingress History</span>
            </Link>

            <div className="w-full sm:w-64">
              <Select value={gate} onValueChange={setGate}>
                <SelectTrigger className="bg-forest border-ivory/20 text-ivory text-xs">
                  <SelectValue placeholder="Select Gate" />
                </SelectTrigger>
                <SelectContent className="bg-forest text-ivory border-ivory/20">
                  <SelectItem value="Gate 1 - Royal & VIP Boulevard">Gate 1 - Royal & VIP Boulevard</SelectItem>
                  <SelectItem value="Gate 2 - General Turnstiles">Gate 2 - General Turnstiles</SelectItem>
                  <SelectItem value="Gate 3 - Media & Hospitality East">Gate 3 - Media & Hospitality East</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Live Counters */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-ivory/15 bg-forest/80 p-4 text-center">
            <span className="text-2xl font-bold font-mono text-ivory">{stats.total}</span>
            <span className="block text-[11px] uppercase tracking-wider text-ivory/60 mt-1">Total Scanned</span>
          </div>
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/40 p-4 text-center">
            <span className="text-2xl font-bold font-mono text-emerald-400">{stats.admitted}</span>
            <span className="block text-[11px] uppercase tracking-wider text-emerald-400/80 mt-1">Admitted</span>
          </div>
          <div className="rounded-xl border border-amber-500/30 bg-amber-950/40 p-4 text-center">
            <span className="text-2xl font-bold font-mono text-amber-400">{stats.duplicate}</span>
            <span className="block text-[11px] uppercase tracking-wider text-amber-400/80 mt-1">Duplicates</span>
          </div>
          <div className="rounded-xl border border-red-500/30 bg-red-950/40 p-4 text-center">
            <span className="text-2xl font-bold font-mono text-red-400">{stats.rejected}</span>
            <span className="block text-[11px] uppercase tracking-wider text-red-400/80 mt-1">Rejected</span>
          </div>
        </div>

        {/* Main Scanner Body */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Viewfinder Simulator */}
          <div className="lg:col-span-7 rounded-2xl border border-ivory/20 bg-forest p-6 space-y-4">
            <div className="flex items-center justify-between text-xs text-ivory/70 border-b border-ivory/10 pb-3">
              <span className="flex items-center gap-1.5">
                <Camera className="size-4 text-gold" />
                Optical Scanner Viewport
              </span>
              <span className="text-emerald-400 font-mono text-[11px]">● CAMERA ACTIVE</span>
            </div>

            {/* Viewfinder Target Box */}
            <div className="relative h-64 sm:h-72 rounded-xl bg-forest-deep flex flex-col items-center justify-center border-2 border-dashed border-ivory/20 overflow-hidden">
              {/* Corner Reticles */}
              <div className="absolute top-4 left-4 size-6 border-t-2 border-l-2 border-gold" />
              <div className="absolute top-4 right-4 size-6 border-t-2 border-r-2 border-gold" />
              <div className="absolute bottom-4 left-4 size-6 border-b-2 border-l-2 border-gold" />
              <div className="absolute bottom-4 right-4 size-6 border-b-2 border-r-2 border-gold" />

              {/* Laser Scanning Animation Bar */}
              <div className="absolute inset-x-8 top-1/2 h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_12px_rgba(239,68,68,0.8)] animate-pulse" />

              <QrCode className="size-28 text-ivory/20" />
              <p className="mt-4 text-xs text-ivory/50">Align Attendee QR Code Within Reticle</p>
            </div>

            {/* Manual Code Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleScan(passInput);
              }}
              className="flex gap-2"
            >
              <Input
                placeholder="Or type pass code e.g. ABK-2026-X7K9"
                value={passInput}
                onChange={(e) => setPassInput(e.target.value)}
                className="bg-forest-deep border-ivory/20 text-ivory placeholder:text-ivory/40"
              />
              <Button
                type="submit"
                disabled={loading}
                className="bg-gold font-semibold text-forest-deep hover:bg-gold/90 shrink-0"
              >
                {loading ? "Verifying..." : "Verify Pass"}
              </Button>
            </form>

            {/* Sample Simulation Shortcuts */}
            <div className="pt-2 text-[11px] text-ivory/60 flex flex-wrap items-center gap-2">
              <span>Quick Test:</span>
              <button
                type="button"
                onClick={() => simulateSampleScan("ABK-2026-VIP-9182")}
                className="underline hover:text-gold"
              >
                Valid Pass
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() => simulateSampleScan("ABK-2026-DUP-001")}
                className="underline hover:text-gold"
              >
                Duplicate Pass
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() => simulateSampleScan("ABK-2026-REVOKED-88")}
                className="underline hover:text-gold"
              >
                Revoked Pass
              </button>
            </div>
          </div>

          {/* Validation Result Feedback Panel */}
          <div className="lg:col-span-5 rounded-2xl border border-ivory/20 bg-forest p-6 space-y-4">
            <h2 className="font-display text-lg font-semibold text-ivory border-b border-ivory/10 pb-3">
              Scan Verification Result
            </h2>

            {lastResult ? (
              <div
                className={`rounded-xl p-5 border text-left space-y-3 transition-all ${
                  lastResult.result === "admitted"
                    ? "bg-emerald-950/60 border-emerald-500 text-emerald-100 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                    : lastResult.result === "already_admitted"
                    ? "bg-amber-950/60 border-amber-500 text-amber-100 shadow-[0_0_20px_rgba(245,158,11,0.2)]"
                    : "bg-red-950/60 border-red-500 text-red-100 shadow-[0_0_20px_rgba(239,68,68,0.2)]"
                }`}
              >
                <div className="flex items-center gap-3">
                  {lastResult.result === "admitted" ? (
                    <CheckCircle2 className="size-8 text-emerald-400 shrink-0" />
                  ) : lastResult.result === "already_admitted" ? (
                    <AlertTriangle className="size-8 text-amber-400 shrink-0" />
                  ) : (
                    <XCircle className="size-8 text-red-400 shrink-0" />
                  )}
                  <div>
                    <h3 className="font-display text-xl font-bold uppercase tracking-wider">
                      {lastResult.result === "admitted"
                        ? "ACCESS GRANTED"
                        : lastResult.result === "already_admitted"
                        ? "DUPLICATE PASS"
                        : "ACCESS DENIED"}
                    </h3>
                    <p className="text-xs opacity-90">{lastResult.message}</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-ivory/20 space-y-2 text-xs">
                  {lastResult.holderName ? (
                    <div className="flex justify-between">
                      <span className="opacity-70">Attendee:</span>
                      <span className="font-bold">{lastResult.holderName}</span>
                    </div>
                  ) : null}
                  {lastResult.passType ? (
                    <div className="flex justify-between">
                      <span className="opacity-70">Pass Tier:</span>
                      <span className="font-semibold text-gold">{lastResult.passType}</span>
                    </div>
                  ) : null}
                  {lastResult.firstCheckedInAt ? (
                    <div className="flex justify-between text-amber-300">
                      <span className="opacity-70">First Admitted:</span>
                      <span>{lastResult.firstCheckedInAt} ({lastResult.lastGate || "Gate 2"})</span>
                    </div>
                  ) : null}
                  <div className="flex justify-between">
                    <span className="opacity-70">Checkpoint:</span>
                    <span>{gate}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-ivory/15 p-8 text-center text-ivory/50 space-y-2">
                <ShieldCheck className="size-10 text-ivory/30 mx-auto" />
                <p className="text-xs">Awaiting first credential scan...</p>
                <p className="text-[11px] text-ivory/40">Point camera at QR pass or type pass code.</p>
              </div>
            )}

            <div className="rounded-xl border border-ivory/10 bg-forest-deep p-4 text-[11px] text-ivory/70 space-y-1.5">
              <p className="font-semibold text-gold">Security Gate Standing Rules:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>All general guests require active accredited digital QR pass.</li>
                <li>Gate 1 reserved for Royal Monarchs, State VIPs &amp; Diplomatic delegations.</li>
                <li>Report duplicate or forged passes immediately to Chief Security Officer.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
