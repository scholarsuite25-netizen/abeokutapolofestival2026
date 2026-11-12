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
  CalendarCheck,
  KeyRound,
  ArrowLeft,
} from "lucide-react";
import { SignOutButton } from "@/components/auth/sign-out-button";
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
  const [eventDay, setEventDay] = useState("1");
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
      eventDay: parseInt(eventDay, 10),
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

  return (
    <div className="flex w-full min-h-[calc(100vh-80px)] flex-col bg-forest-deep text-ivory p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-4xl w-full space-y-6">
        {/* Navigation & Session Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ivory/15 pb-3">
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-lg border border-ivory/20 bg-ivory/10 px-3 py-1.5 text-xs font-semibold text-ivory hover:bg-gold hover:text-black transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Site</span>
            </Link>
            <Link
              href="/abawole"
              className="inline-flex items-center gap-1.5 rounded-lg border border-gold/40 bg-gold/15 px-3 py-1.5 text-xs font-semibold text-gold hover:bg-gold hover:text-black transition-colors"
            >
              <span>Command Centre (/abawole)</span>
            </Link>
          </div>

          <SignOutButton
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/40 bg-red-600/80 hover:bg-red-600 text-white px-3 py-1.5 text-xs font-semibold shadow-xs"
          />
        </div>

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-ivory/20 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <Badge
                variant="outline"
                className="border-gold/50 bg-gold/10 text-gold text-[10px] uppercase tracking-wider"
              >
                Access Control Protocol · Live
              </Badge>
            </div>
            <h1 className="mt-1 font-display text-2xl font-semibold sm:text-3xl text-ivory">
              Security Gate Scanner &amp; 3-Day Attendance
            </h1>
            <p className="text-xs text-ivory/60">
              Abeokuta Polo Club Grounds · Daily Turnstile Attendance Verification
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            {/* Event Day Selector */}
            <div className="w-full sm:w-44">
              <Select value={eventDay} onValueChange={setEventDay}>
                <SelectTrigger className="bg-forest border-gold/40 text-gold font-semibold text-xs">
                  <SelectValue placeholder="Tournament Day" />
                </SelectTrigger>
                <SelectContent className="bg-forest text-ivory border-ivory/20">
                  <SelectItem value="1">Day 1 (Fri 18 Dec)</SelectItem>
                  <SelectItem value="2">Day 2 (Sat 19 Dec)</SelectItem>
                  <SelectItem value="3">Day 3 (Sun 20 Dec)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Gate Selector */}
            <div className="w-full sm:w-56">
              <Select value={gate} onValueChange={setGate}>
                <SelectTrigger className="bg-forest border-ivory/20 text-ivory text-xs">
                  <SelectValue placeholder="Select Gate" />
                </SelectTrigger>
                <SelectContent className="bg-forest text-ivory border-ivory/20">
                  <SelectItem value="Gate 1 - Royal & VIP Boulevard">Gate 1 - Royal &amp; VIP Boulevard</SelectItem>
                  <SelectItem value="Gate 2 - General Turnstiles">Gate 2 - General Turnstiles</SelectItem>
                  <SelectItem value="Gate 3 - Media & Hospitality East">Gate 3 - Media &amp; Hospitality East</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Live Counters */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-ivory/15 bg-forest/80 p-4 text-center">
            <span className="text-2xl font-bold font-mono text-ivory">{stats.total}</span>
            <span className="block text-[11px] uppercase tracking-wider text-ivory/60 mt-1">Total Scans</span>
          </div>
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/40 p-4 text-center">
            <span className="text-2xl font-bold font-mono text-emerald-400">{stats.admitted}</span>
            <span className="block text-[11px] uppercase tracking-wider text-emerald-400/80 mt-1">Admitted</span>
          </div>
          <div className="rounded-xl border border-amber-500/30 bg-amber-950/40 p-4 text-center">
            <span className="text-2xl font-bold font-mono text-amber-400">{stats.duplicate}</span>
            <span className="block text-[11px] uppercase tracking-wider text-amber-400/80 mt-1">Day Duplicate</span>
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
              <span className="flex items-center gap-1.5 font-semibold text-ivory">
                <Camera className="size-4 text-gold" />
                Optical Turnstile Scanner — Day {eventDay}
              </span>
              <span className="text-emerald-400 font-mono text-[11px]">● CAMERA SENSOR ONLINE</span>
            </div>

            {/* Viewfinder Target Box */}
            <div className="relative h-64 sm:h-72 rounded-xl bg-forest-deep flex flex-col items-center justify-center border-2 border-dashed border-ivory/20 overflow-hidden">
              <div className="absolute top-4 left-4 size-6 border-t-2 border-l-2 border-gold" />
              <div className="absolute top-4 right-4 size-6 border-t-2 border-r-2 border-gold" />
              <div className="absolute bottom-4 left-4 size-6 border-b-2 border-l-2 border-gold" />
              <div className="absolute bottom-4 right-4 size-6 border-b-2 border-r-2 border-gold" />

              <div className="absolute inset-x-8 top-1/2 h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_12px_rgba(239,68,68,0.8)] animate-pulse" />

              <QrCode className="size-28 text-ivory/20" />
              <p className="mt-4 text-xs text-ivory/60">Position Attendee QR Access Card Within Reticle</p>
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
                placeholder="Or scan/type Pass Code e.g. ABK-2026-X7K9"
                value={passInput}
                onChange={(e) => setPassInput(e.target.value)}
                className="bg-forest-deep border-ivory/20 text-ivory placeholder:text-ivory/40"
              />
              <Button
                type="submit"
                disabled={loading}
                className="bg-gold font-semibold text-forest-deep hover:bg-gold/90 shrink-0 cursor-pointer"
              >
                {loading ? "Verifying..." : "Scan Pass"}
              </Button>
            </form>

            
          </div>

          {/* Validation Result Feedback Panel */}
          <div className="lg:col-span-5 rounded-2xl border border-ivory/20 bg-forest p-6 space-y-4">
            <h2 className="font-display text-lg font-semibold text-ivory border-b border-ivory/10 pb-3">
              Gate Ingress Verification
            </h2>

            {lastResult ? (
              <div
                className={`rounded-xl p-5 border text-left space-y-3 transition-all ${
                  lastResult.result === "admitted"
                    ? "bg-emerald-950/60 border-emerald-500 text-emerald-100 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                    : lastResult.result === "already_admitted"
                    ? "bg-amber-950/60 border-amber-500 text-amber-100 shadow-[0_0_20px_rgba(245,158,11,0.2)]"
                    : lastResult.message.includes("PAYMENT UNVERIFIED")
                    ? "bg-amber-950/80 border-2 border-amber-500 text-amber-100 shadow-[0_0_25px_rgba(245,158,11,0.3)]"
                    : "bg-red-950/60 border-red-500 text-red-100 shadow-[0_0_20px_rgba(239,68,68,0.2)]"
                }`}
              >
                <div className="flex items-center gap-3">
                  {lastResult.result === "admitted" ? (
                    <CheckCircle2 className="size-8 text-emerald-400 shrink-0" />
                  ) : lastResult.result === "already_admitted" || lastResult.message.includes("PAYMENT UNVERIFIED") ? (
                    <AlertTriangle className="size-8 text-amber-400 shrink-0" />
                  ) : (
                    <XCircle className="size-8 text-red-400 shrink-0" />
                  )}
                  <div>
                    <h3 className="font-display text-xl font-bold uppercase tracking-wider">
                      {lastResult.result === "admitted"
                        ? `DAY ${eventDay} ADMISSION GRANTED`
                        : lastResult.result === "already_admitted"
                        ? `ALREADY ADMITTED (DAY ${eventDay})`
                        : lastResult.message.includes("PAYMENT UNVERIFIED")
                        ? "PAYMENT UNVERIFIED — ADMISSION DENIED"
                        : "ACCESS DENIED"}
                    </h3>
                    <p className="text-xs opacity-90">{lastResult.message}</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-ivory/20 space-y-2 text-xs">
                  {lastResult.holderName && (
                    <div className="flex justify-between">
                      <span className="opacity-70">Attendee:</span>
                      <span className="font-bold">{lastResult.holderName}</span>
                    </div>
                  )}
                  {lastResult.passType && (
                    <div className="flex justify-between">
                      <span className="opacity-70">Tier:</span>
                      <span className="font-semibold text-gold">{lastResult.passType}</span>
                    </div>
                  )}
                  {(lastResult.hostName || lastResult.organization) && (
                    <div className="flex justify-between">
                      <span className="opacity-70">Affiliation:</span>
                      <span className="font-semibold text-gold">
                        {lastResult.hostName ? `Guest of ${lastResult.hostName}` : `Corporate: ${lastResult.organization}`}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="opacity-70">Checkpoint:</span>
                    <span>{gate}</span>
                  </div>

                  {/* 3-Day Attendance Progress Tracker */}
                  <div className="pt-2 border-t border-ivory/15">
                    <span className="text-[10px] font-bold uppercase text-ivory/70 block mb-1.5 flex items-center gap-1">
                      <CalendarCheck className="size-3 text-gold" /> Attendance Across 3 Days:
                    </span>
                    <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
                      <div
                        className={`rounded p-1 font-semibold ${
                          lastResult.day1CheckedIn
                            ? "bg-emerald-500/30 text-emerald-300 border border-emerald-500/40"
                            : "bg-white/5 text-ivory/40"
                        }`}
                      >
                        Day 1: {lastResult.day1CheckedIn ? "Checked In" : "Not Yet"}
                      </div>
                      <div
                        className={`rounded p-1 font-semibold ${
                          lastResult.day2CheckedIn
                            ? "bg-emerald-500/30 text-emerald-300 border border-emerald-500/40"
                            : "bg-white/5 text-ivory/40"
                        }`}
                      >
                        Day 2: {lastResult.day2CheckedIn ? "Checked In" : "Not Yet"}
                      </div>
                      <div
                        className={`rounded p-1 font-semibold ${
                          lastResult.day3CheckedIn
                            ? "bg-emerald-500/30 text-emerald-300 border border-emerald-500/40"
                            : "bg-white/5 text-ivory/40"
                        }`}
                      >
                        Day 3: {lastResult.day3CheckedIn ? "Checked In" : "Not Yet"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-ivory/15 p-8 text-center text-ivory/50 space-y-2">
                <ShieldCheck className="size-10 text-ivory/30 mx-auto" />
                <p className="text-xs">Awaiting gate scan for Day {eventDay}...</p>
                <p className="text-[11px] text-ivory/40">Point optical scanner at attendee access card.</p>
              </div>
            )}

            <div className="rounded-xl border border-ivory/10 bg-forest-deep p-4 text-[11px] text-ivory/70 space-y-1.5">
              <p className="font-semibold text-gold">Gate Attendant Operating Guide:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Make sure the top dropdown matches today&apos;s tournament day.</li>
                <li>Each attendee&apos;s access card is scanned once per day to record daily attendance.</li>
                <li>Duplicates on the same day alert in amber; foreign or forged tokens alert in red.</li>
              </ul>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-ivory/10 bg-white/5 px-4 py-3 text-xs">
              <span className="text-ivory/60">Gate Marshal Credentials</span>
              <Link
                href="/abawole/change-password"
                className="inline-flex items-center gap-1.5 rounded-lg border border-gold/30 bg-gold/10 px-3 py-1.5 text-xs font-semibold text-gold hover:bg-gold/20 transition-colors"
              >
                <KeyRound className="size-3.5" />
                <span>Change Marshal Password</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
