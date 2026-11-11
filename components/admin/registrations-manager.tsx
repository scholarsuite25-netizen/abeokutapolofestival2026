"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Download,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit,
  Building,
  UserCheck,
  ExternalLink,
  Crown,
  Calendar,
  CreditCard,
  KeyRound,
  Send,
  CheckCircle2,
  Radio,
  Landmark,
} from "lucide-react";
import { WhatsAppIcon } from "@/components/shared/whatsapp-icon";
import { formatWhatsAppUrl } from "@/lib/utils/phone";
import { getSiteOrigin } from "@/lib/site";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  createParticipantAction,
  updateParticipantAction,
  deleteParticipantAction,
  approveRegistrationAction,
  denyRegistrationAction,
} from "@/lib/actions/registrations";

export interface ParticipantRecord {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  category: string;
  group_size: number;
  status: string;
  affiliation_type: "individual" | "guest_of" | "corporate";
  host_name?: string | null;
  organization?: string | null;
  created_at: string;
  day1?: boolean;
  day2?: boolean;
  day3?: boolean;
  payment_method?: string | null;
  bank_transfer_ref?: string | null;
  day3_ticket_ref?: string | null;
  day3_payment_ref?: string | null;
  day3_invitation_code?: string | null;
  credentials?: Array<{
    id: string;
    pass_code: string;
    pass_type?: string;
    status: string;
    bank_transfer_ref?: string | null;
    day3_ticket_ref?: string | null;
    day1_checked_in_at?: string | null;
    day2_checked_in_at?: string | null;
    day3_checked_in_at?: string | null;
  }> | null;
}

interface BroadcastResult {
  success?: boolean;
  error?: string;
  channelStrategy?: string;
  totalProcessed?: number;
  whatsappPrimarySent?: number;
  whatsappQueued?: number;
  emailsSent?: number;
  logs?: string[];
  whatsappDirectLinks?: Array<{
    name: string;
    passCode: string;
    url: string;
  }>;
}

interface RegistrationsManagerProps {
  initialParticipants: ParticipantRecord[];
}

export function RegistrationsManager({ initialParticipants }: RegistrationsManagerProps) {
  const [participants, setParticipants] = useState<ParticipantRecord[]>(initialParticipants);
  const [activeDayTab, setActiveDayTab] = useState<"all" | "day1" | "day2" | "day3">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [isPending, startTransition] = useTransition();

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState<ParticipantRecord | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // WhatsApp & Email Broadcast Station state
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);
  const [broadcastType, setBroadcastType] = useState<"weekly" | "daily">("weekly");
  const [broadcastDay, setBroadcastDay] = useState<1 | 2 | 3>(1);
  const [broadcastTestPhone, setBroadcastTestPhone] = useState("");
  const [broadcastTestEmail, setBroadcastTestEmail] = useState("");
  const [broadcastLoading, setBroadcastLoading] = useState(false);
  const [broadcastResponse, setBroadcastResponse] = useState<BroadcastResult | null>(null);

  const handleTriggerBroadcast = async (isTestOnly: boolean) => {
    setBroadcastLoading(true);
    setBroadcastResponse(null);
    try {
      const res = await fetch("/api/reminders/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: broadcastType,
          dayNumber: broadcastDay,
          testPhone: isTestOnly ? broadcastTestPhone || "+234 803 123 4567" : undefined,
          testEmail: isTestOnly ? broadcastTestEmail || "abeokutapolo@gmail.com" : undefined,
          testName: isTestOnly ? "Secretariat Test Recipient" : undefined,
          limit: isTestOnly ? 1 : 2500,
        }),
      });
      const data = await res.json();
      setBroadcastResponse(data);
    } catch (err) {
      setBroadcastResponse({ success: false, error: String(err) });
    } finally {
      setBroadcastLoading(false);
    }
  };

  // Form state
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    category: "Individual Attendee",
    day1: true,
    day2: true,
    day3: false,
    day3PaymentRef: "",
    day3InvitationCode: "",
    affiliationType: "individual" as "individual" | "guest_of" | "corporate",
    hostName: "",
    organization: "",
    autoApprove: true,
  });

  // Day filter predicates
  const isDay1 = (p: ParticipantRecord) => {
    if (p.day1 !== undefined) return p.day1;
    // Derive from credentials or category
    return (
      p.credentials?.some(
        (c) =>
          c.pass_code.includes("D1") ||
          c.pass_code.includes("D12") ||
          c.day1_checked_in_at !== null ||
          (!c.pass_code.includes("VVIP") && !c.pass_code.includes("D2-")),
      ) ?? true
    );
  };

  const isDay2 = (p: ParticipantRecord) => {
    if (p.day2 !== undefined) return p.day2;
    return (
      p.credentials?.some(
        (c) =>
          c.pass_code.includes("D2") ||
          c.pass_code.includes("D12") ||
          c.day2_checked_in_at !== null ||
          (!c.pass_code.includes("VVIP") && !c.pass_code.includes("D1-")),
      ) ?? true
    );
  };

  const isDay3 = (p: ParticipantRecord) => {
    if (p.day3 !== undefined) return p.day3;
    return (
      p.credentials?.some(
        (c) =>
          c.pass_code.includes("VVIP") ||
          c.pass_type?.includes("VVIP") ||
          c.pass_type?.includes("Day 3") ||
          c.day3_checked_in_at !== null,
      ) ||
      p.category.includes("VVIP") ||
      p.category.includes("Patron") ||
      Boolean(p.day3_payment_ref || p.day3_invitation_code)
    );
  };

  // Summary counts
  const day1Count = participants.filter(isDay1).length;
  const day2Count = participants.filter(isDay2).length;
  const day3Count = participants.filter(isDay3).length;

  // Filter logic
  const filtered = participants.filter((p) => {
    // 1. Day tab filtering
    if (activeDayTab === "day1" && !isDay1(p)) return false;
    if (activeDayTab === "day2" && !isDay2(p)) return false;
    if (activeDayTab === "day3" && !isDay3(p)) return false;

    // 2. Search query filtering
    const fullName = `${p.first_name} ${p.last_name}`.toLowerCase();
    const query = searchQuery.toLowerCase();
    const passCodes = p.credentials?.map((c) => c.pass_code.toLowerCase()).join(" ") || "";
    const host = (p.host_name || "").toLowerCase();
    const org = (p.organization || "").toLowerCase();

    const matchesSearch =
      fullName.includes(query) ||
      p.email.toLowerCase().includes(query) ||
      p.phone.includes(query) ||
      passCodes.includes(query) ||
      host.includes(query) ||
      org.includes(query);

    // 3. Category filtering
    const matchesCategory =
      selectedCategory === "all" ||
      (selectedCategory === "individual" &&
        (p.affiliation_type === "individual" || p.category.includes("Individual"))) ||
      (selectedCategory === "guest_of" &&
        (p.affiliation_type === "guest_of" || p.category.includes("Guest of"))) ||
      (selectedCategory === "corporate" &&
        (p.affiliation_type === "corporate" || p.category.includes("Corporate")));

    // 4. Status filtering
    const isPendingStatus =
      p.status === "pending_approval" ||
      p.status === "pending_bank_verification" ||
      p.status === "pending_verification";
    const matchesStatus =
      selectedStatus === "all" ||
      (selectedStatus === "pending_approval" ? isPendingStatus : p.status === selectedStatus);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // CSV Export for active view
  const handleExportCSV = () => {
    const headers = [
      "ID",
      "First Name",
      "Last Name",
      "Email",
      "Phone",
      "Category",
      "Affiliation",
      "Pass Codes",
      "Status",
      "Day 1 Attended",
      "Day 2 Attended",
      "Day 3 Attended",
      "Registered At",
    ];

    const rows = filtered.map((p) => {
      const creds = p.credentials || [];
      const passCodes = creds.map((c) => c.pass_code).join(" | ") || "N/A";
      const d1Checked = creds.some((c) => c.day1_checked_in_at) ? "YES" : "NO";
      const d2Checked = creds.some((c) => c.day2_checked_in_at) ? "YES" : "NO";
      const d3Checked = creds.some((c) => c.day3_checked_in_at) ? "YES" : "NO";

      return [
        p.id,
        `"${p.first_name.replace(/"/g, '""')}"`,
        `"${p.last_name.replace(/"/g, '""')}"`,
        `"${p.email.replace(/"/g, '""')}"`,
        `"${p.phone.replace(/"/g, '""')}"`,
        `"${p.category.replace(/"/g, '""')}"`,
        p.affiliation_type,
        `"${passCodes}"`,
        p.status,
        d1Checked,
        d2Checked,
        d3Checked,
        new Date(p.created_at).toLocaleString(),
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Abeokuta_Polo_Attendees_${activeDayTab.toUpperCase()}_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Add Participant
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setActionSuccess(null);

    startTransition(async () => {
      const res = await createParticipantAction({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        category: formData.day3 ? "Day 3 VVIP Grand Finale Pass" : formData.category,
        groupSize: 1, // Single registration only
        affiliationType: formData.affiliationType,
        hostName: formData.hostName,
        organization: formData.organization,
        autoApprove: formData.autoApprove,
      });

      if (res.ok) {
        setActionSuccess(
          `Participant added successfully! ${res.passCode ? `Pass Code: ${res.passCode}` : ""}`,
        );
        setIsAddOpen(false);

        const newRecord: ParticipantRecord = {
          id: crypto.randomUUID(),
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          category: formData.day3 ? "Day 3 VVIP Grand Finale Pass" : formData.category,
          group_size: 1,
          status: formData.autoApprove ? "confirmed" : "pending_approval",
          affiliation_type: formData.affiliationType,
          host_name: formData.hostName || null,
          organization: formData.organization || null,
          created_at: new Date().toISOString(),
          day1: formData.day1,
          day2: formData.day2,
          day3: formData.day3,
          day3_payment_ref: formData.day3PaymentRef || null,
          day3_invitation_code: formData.day3InvitationCode || null,
          credentials: res.passCode
            ? [{ id: crypto.randomUUID(), pass_code: res.passCode, status: "active" }]
            : null,
        };
        setParticipants([newRecord, ...participants]);
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          category: "Individual Attendee",
          day1: true,
          day2: true,
          day3: false,
          day3PaymentRef: "",
          day3InvitationCode: "",
          affiliationType: "individual",
          hostName: "",
          organization: "",
          autoApprove: true,
        });
      } else {
        setActionError(res.error || "Failed to create participant.");
      }
    });
  };

  // Edit Participant
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingParticipant) return;
    setActionError(null);
    setActionSuccess(null);

    startTransition(async () => {
      const res = await updateParticipantAction(editingParticipant.id, {
        firstName: editingParticipant.first_name,
        lastName: editingParticipant.last_name,
        email: editingParticipant.email,
        phone: editingParticipant.phone,
        category: editingParticipant.category,
        groupSize: 1,
        affiliationType: editingParticipant.affiliation_type,
        hostName: editingParticipant.host_name || "",
        organization: editingParticipant.organization || "",
      });

      if (res.ok) {
        setActionSuccess("Participant updated successfully.");
        setParticipants((prev) =>
          prev.map((p) => (p.id === editingParticipant.id ? editingParticipant : p)),
        );
        setEditingParticipant(null);
      } else {
        setActionError(res.error || "Failed to update participant.");
      }
    });
  };

  // Delete Participant
  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete participant ${name}?`)) return;
    setActionError(null);
    setActionSuccess(null);

    startTransition(async () => {
      const res = await deleteParticipantAction(id);
      if (res.ok) {
        setActionSuccess("Participant record deleted.");
        setParticipants((prev) => prev.filter((p) => p.id !== id));
      } else {
        setActionError(res.error || "Failed to delete participant.");
      }
    });
  };

  // 1-Click Approve
  const handleApprove = (id: string) => {
    startTransition(async () => {
      const res = await approveRegistrationAction(id);
      if (res.ok) {
        setActionSuccess("Registration approved and credential issued!");
        setParticipants((prev) =>
          prev.map((p) => (p.id === id ? { ...p, status: "confirmed" } : p)),
        );
      } else {
        setActionError(res.error || "Approval failed.");
      }
    });
  };

  // 1-Click Deny
  const handleDeny = (id: string) => {
    if (!confirm("Are you sure you want to decline this registration?")) return;
    startTransition(async () => {
      const res = await denyRegistrationAction(id);
      if (res.ok) {
        setActionSuccess("Registration declined.");
        setParticipants((prev) =>
          prev.map((p) => (p.id === id ? { ...p, status: "declined" } : p)),
        );
      } else {
        setActionError(res.error || "Decline action failed.");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Alert Notices */}
      {actionError && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-xs text-red-800">
          {actionError}
        </div>
      )}
      {actionSuccess && (
        <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-4 text-xs text-emerald-800 flex items-center justify-between">
          <span>{actionSuccess}</span>
          <button onClick={() => setActionSuccess(null)} className="font-bold">
            ×
          </button>
        </div>
      )}

      {/* ── METRIC CARDS ROW: SUMMARY BY DAY ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl border border-line bg-card p-4 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-brand block">
            Total Unique Registrants
          </span>
          <span className="text-2xl font-bold text-forest mt-1 block">
            {participants.length}
          </span>
          <span className="text-[11px] text-muted-brand">All event attendees</span>
        </div>

        <div className="rounded-xl border border-emerald-500/30 bg-emerald-50/50 p-4 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
            Day 1 Attendees (Fri 18)
          </span>
          <span className="text-2xl font-bold text-emerald-950 mt-1 block">
            {day1Count}
          </span>
          <span className="text-[11px] text-emerald-700">100% Free Public Entry</span>
        </div>

        <div className="rounded-xl border border-emerald-500/30 bg-emerald-50/50 p-4 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
            Day 2 Attendees (Sat 19)
          </span>
          <span className="text-2xl font-bold text-emerald-950 mt-1 block">
            {day2Count}
          </span>
          <span className="text-[11px] text-emerald-700">100% Free Public Entry</span>
        </div>

        <div className="rounded-xl border border-amber-500/40 bg-amber-50/60 p-4 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 block flex items-center gap-1">
            <Crown className="size-3 text-amber-600" /> Day 3 VVIP (Sun 20)
          </span>
          <span className="text-2xl font-bold text-amber-950 mt-1 block">
            {day3Count}
          </span>
          <span className="text-[11px] text-amber-800">Paid VVIP &amp; Special Invites</span>
        </div>
      </div>

      {/* ── BACKEND SEPARATE DAY TABLES NAVIGATION ── */}
      <div className="rounded-xl border border-line bg-card p-4 shadow-xs space-y-4">
        {/* Day Tabs Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveDayTab("all")}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                activeDayTab === "all"
                  ? "bg-forest text-ivory shadow-xs"
                  : "bg-sage/40 text-muted-brand hover:bg-sage hover:text-forest"
              }`}
            >
              All Attendees ({participants.length})
            </button>

            <button
              onClick={() => setActiveDayTab("day1")}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeDayTab === "day1"
                  ? "bg-emerald-800 text-ivory shadow-xs"
                  : "bg-emerald-50 text-emerald-900 border border-emerald-300 hover:bg-emerald-100"
              }`}
            >
              <Calendar className="size-3.5" /> Day 1 Attendees (Fri 18 - Free) [{day1Count}]
            </button>

            <button
              onClick={() => setActiveDayTab("day2")}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeDayTab === "day2"
                  ? "bg-emerald-800 text-ivory shadow-xs"
                  : "bg-emerald-50 text-emerald-900 border border-emerald-300 hover:bg-emerald-100"
              }`}
            >
              <Calendar className="size-3.5" /> Day 2 Attendees (Sat 19 - Free) [{day2Count}]
            </button>

            <button
              onClick={() => setActiveDayTab("day3")}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeDayTab === "day3"
                  ? "bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-xs"
                  : "bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100"
              }`}
            >
              <Crown className="size-3.5" /> Day 3 Attendees (Sun 20 - Paid VVIP) [{day3Count}]
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={() => setIsBroadcastOpen(true)}
              size="sm"
              className="bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <WhatsAppIcon className="size-3.5" />
              WhatsApp &amp; Email Dispatch
            </Button>
            <Button
              onClick={handleExportCSV}
              variant="outline"
              size="sm"
              className="border-line text-forest font-semibold text-xs"
            >
              <Download className="mr-1.5 size-3.5 text-gold-deep" />
              Download {activeDayTab === "all" ? "All" : activeDayTab.toUpperCase()} CSV ({filtered.length})
            </Button>
            <Button
              onClick={() => setIsAddOpen(true)}
              size="sm"
              className="bg-forest text-ivory hover:bg-forest-interactive font-semibold text-xs"
            >
              <Plus className="mr-1.5 size-3.5" />
              Add Participant
            </Button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 size-4 text-muted-brand" />
            <Input
              placeholder={`Search ${activeDayTab === "all" ? "all" : activeDayTab.toUpperCase()} attendees by name, email, phone, pass code...`}
              className="pl-9 bg-ivory text-xs"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-muted-brand flex items-center gap-1">
                <Filter className="size-3" /> Category:
              </span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="rounded-md border border-line bg-ivory px-2 py-1 text-xs text-forest"
              >
                <option value="all">All</option>
                <option value="individual">Individual</option>
                <option value="guest_of">Guest of Member</option>
                <option value="corporate">Corporate</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-muted-brand">Status:</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="rounded-md border border-line bg-ivory px-2 py-1 text-xs text-forest"
              >
                <option value="all">All</option>
                <option value="confirmed">Confirmed</option>
                <option value="pending_approval">Pending Review</option>
                <option value="declined">Declined</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ── ATTENDEES TABLE (SHOWING EACH DAY SEPARATELY) ── */}
      <div className="overflow-hidden rounded-xl border border-line bg-card shadow-xs">
        <div className="border-b border-line bg-sage/20 px-4 py-2.5 flex items-center justify-between">
          <span className="text-xs font-bold text-forest uppercase tracking-wider">
            {activeDayTab === "all"
              ? "All Event Registrations"
              : activeDayTab === "day1"
              ? "Day 1 Attendees (Friday 18 Dec 2026 — 100% Free Entry)"
              : activeDayTab === "day2"
              ? "Day 2 Attendees (Saturday 19 Dec 2026 — 100% Free Entry)"
              : "Day 3 Attendees (Sunday 20 Dec 2026 — Paid VVIP / Special Invitation)"}
          </span>
          <span className="text-[11px] text-muted-brand">
            Showing {filtered.length} attendee{filtered.length === 1 ? "" : "s"}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-line bg-sage/30 text-forest font-semibold">
              <tr>
                <th className="px-4 py-3">Attendee</th>
                <th className="px-4 py-3">Category &amp; Affiliation</th>
                <th className="px-4 py-3">Issued ID Pass(es)</th>
                <th className="px-4 py-3">Gate Fee &amp; Payment</th>
                <th className="px-4 py-3">Turnstile Attendance</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-brand">
                    No attendees found for this view matching your criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const creds = p.credentials || [];
                  const primaryCred = creds[0];
                  const hasVvipCred = creds.some(
                    (c) => c.pass_code.includes("VVIP") || c.pass_type?.includes("VVIP"),
                  );
                  const isBankWire = 
                    p.payment_method === "bank_transfer" || 
                    Boolean(p.bank_transfer_ref) ||
                    Boolean(primaryCred?.bank_transfer_ref);
                  const bankRef = p.bank_transfer_ref || primaryCred?.bank_transfer_ref;
                  const isPaystack = 
                    p.payment_method === "paystack" || 
                    Boolean(p.day3_payment_ref) || 
                    Boolean(p.day3_ticket_ref && p.day3_ticket_ref.startsWith("PSTK-"));
                  const paystackRef = p.day3_payment_ref || p.day3_ticket_ref;

                  return (
                    <tr key={p.id} className="hover:bg-sage/10 transition-colors">
                      {/* Name & Contact */}
                      <td className="px-4 py-3">
                        <div className="font-semibold text-forest text-sm">
                          {p.first_name} {p.last_name}
                        </div>
                        <div className="text-muted-brand text-[11px] mt-0.5">
                          {p.email} · {p.phone}
                        </div>
                      </td>

                      {/* Tier & Affiliation */}
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-semibold ${
                            hasVvipCred || activeDayTab === "day3"
                              ? "border-amber-500 text-amber-900 bg-amber-50"
                              : "border-gold text-gold-deep"
                          }`}
                        >
                          {p.category}
                        </Badge>
                        <div className="text-[11px] text-muted-brand mt-1 flex items-center gap-1">
                          {p.affiliation_type === "guest_of" ? (
                            <>
                              <UserCheck className="size-3 text-gold-deep" />
                              <span>Guest of: <strong className="text-forest">{p.host_name || "N/A"}</strong></span>
                            </>
                          ) : p.affiliation_type === "corporate" ? (
                            <>
                              <Building className="size-3 text-gold-deep" />
                              <span>Corporate: <strong className="text-forest">{p.organization || "N/A"}</strong></span>
                            </>
                          ) : (
                            <span className="text-muted-brand">Individual Attendee</span>
                          )}
                        </div>
                      </td>

                      {/* Pass Code(s) */}
                      <td className="px-4 py-3">
                        {creds.length > 0 ? (
                          <div className="space-y-1">
                            {creds.map((c) => {
                              const isGoldPass = c.pass_code.includes("VVIP");
                              return (
                                <div key={c.id} className="flex items-center gap-1.5">
                                  <span
                                    className={`font-mono font-bold text-xs px-1.5 py-0.5 rounded ${
                                      isGoldPass
                                        ? "bg-amber-100 text-amber-900 border border-amber-300"
                                        : "bg-forest/10 text-forest"
                                    }`}
                                  >
                                    {c.pass_code}
                                  </span>
                                  <Link
                                    href={`/pass/${c.pass_code}`}
                                    target="_blank"
                                    title="View Digital ID Pass"
                                    className="text-muted-brand hover:text-forest"
                                  >
                                    <ExternalLink className="size-3.5 text-gold-deep" />
                                  </Link>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="text-muted-brand italic">Not yet issued</span>
                        )}
                      </td>

                      {/* Gate Fee & Payment Column (Always Visible) */}
                      <td className="px-4 py-3">
                        {isBankWire ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-900 border border-amber-300">
                              <Landmark className="size-3 text-gold-deep" /> Bank Wire (WEMA)
                            </span>
                            <div className="font-mono text-[10px] text-muted-brand font-bold">
                              Ref: {bankRef || "ABK-WEMA"}
                            </div>
                            {p.status === "pending_bank_verification" || p.status === "pending_verification" ? (
                              <span className="inline-block text-[9px] font-semibold text-amber-700">
                                Pending Treasury Review
                              </span>
                            ) : (
                              <span className="inline-block text-[9px] font-semibold text-emerald-700">
                                Wire Reconciled
                              </span>
                            )}
                          </div>
                        ) : isPaystack ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-300">
                              <CreditCard className="size-3 text-emerald-600" /> Paystack Online
                            </span>
                            <div className="font-mono text-[10px] text-muted-brand font-bold">
                              Ref: {paystackRef}
                            </div>
                          </div>
                        ) : p.day3_invitation_code ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 rounded bg-purple-100 px-1.5 py-0.5 text-[10px] font-bold text-purple-900 border border-purple-300">
                              <KeyRound className="size-3 text-purple-700" /> VIP Special Invite
                            </span>
                            <div className="font-mono text-[10px] text-muted-brand">
                              Code: {p.day3_invitation_code}
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-800">
                              100% Free Public Entry
                            </span>
                            <div className="text-[10px] text-muted-brand">Days 1 &amp; 2 Admitted</div>
                          </div>
                        )}
                      </td>

                      {/* Daily Attendance Column */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-[10px]">
                          <span
                            title="Day 1: Fri 18 Dec (Free)"
                            className={`rounded px-1.5 py-0.5 font-semibold ${
                              primaryCred?.day1_checked_in_at
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-gray-100 text-gray-500"
                            }`}
                          >
                            D1: {primaryCred?.day1_checked_in_at ? "In" : "—"}
                          </span>
                          <span
                            title="Day 2: Sat 19 Dec (Free)"
                            className={`rounded px-1.5 py-0.5 font-semibold ${
                              primaryCred?.day2_checked_in_at
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-gray-100 text-gray-500"
                            }`}
                          >
                            D2: {primaryCred?.day2_checked_in_at ? "In" : "—"}
                          </span>
                          <span
                            title="Day 3: Sun 20 Dec (VVIP)"
                            className={`rounded px-1.5 py-0.5 font-semibold ${
                              primaryCred?.day3_checked_in_at
                                ? "bg-amber-100 text-amber-900"
                                : "bg-gray-100 text-gray-500"
                            }`}
                          >
                            D3: {primaryCred?.day3_checked_in_at ? "In" : "—"}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            p.status === "confirmed"
                              ? "bg-emerald-100 text-emerald-800"
                              : p.status === "pending_approval" ||
                                p.status === "pending_bank_verification" ||
                                p.status === "pending_verification"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {p.status === "confirmed"
                            ? "Confirmed"
                            : p.status === "pending_bank_verification" ||
                              p.status === "pending_verification"
                            ? "Pending Bank Verification"
                            : p.status === "pending_approval"
                            ? "Pending Review"
                            : "Declined"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {(p.status === "pending_approval" ||
                            p.status === "pending_bank_verification" ||
                            p.status === "pending_verification") && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleApprove(p.id)}
                                disabled={isPending}
                                className="h-7 bg-emerald-800 hover:bg-emerald-900 text-ivory text-[11px] px-2"
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeny(p.id)}
                                disabled={isPending}
                                className="h-7 border-red-300 text-red-700 text-[11px] px-2"
                              >
                                Decline
                              </Button>
                            </>
                          )}
                          {/* Direct WhatsApp Instant Dispatch (Option 1 Primary Channel) */}
                          {(() => {
                            const pCode = creds[0]?.pass_code || "PENDING";
                            const siteOrigin =
                              typeof window !== "undefined"
                                ? window.location.origin
                                : getSiteOrigin();
                            const pUrl = `${siteOrigin}/pass/${pCode}`;
                            const waText = `🏇 *ABEOKUTA POLO FESTIVAL 2026 — OFFICIAL PASS ACCREDITATION*\n\nHello *${p.first_name} ${p.last_name}*,\n\nYour official gate accreditation pass is *${pCode}* (${p.category}).\n\n👉 *View & Save your pass on phone:* ${pUrl}\n\n📍 *Venue:* Abeokuta Polo Club & Country Resort, Kobape\n_Please present this pass at turnstiles for entry._`;
                            const waUrl = formatWhatsAppUrl(p.phone, waText);

                            return (
                              <Button
                                asChild
                                size="sm"
                                variant="ghost"
                                title={`Send WhatsApp Pass to ${p.phone} (Option 1 Primary)`}
                                className="h-7 w-7 p-0 text-[#25D366] hover:text-emerald-700 hover:bg-emerald-50 cursor-pointer"
                              >
                                <a href={waUrl} target="_blank" rel="noopener noreferrer">
                                  <WhatsAppIcon className="size-3.5" />
                                </a>
                              </Button>
                            );
                          })()}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingParticipant(p)}
                            title="Edit Participant"
                            className="h-7 w-7 p-0 text-muted-brand hover:text-forest"
                          >
                            <Edit className="size-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              handleDelete(p.id, `${p.first_name} ${p.last_name}`)
                            }
                            title="Delete Participant"
                            className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MODAL 1: ADD PARTICIPANT (SINGLE REGISTRATION ONLY) ── */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-line bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="font-serif text-lg font-semibold text-forest">Add Participant</h3>
              <button
                onClick={() => setIsAddOpen(false)}
                className="text-muted-brand hover:text-forest font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-forest">First Name *</label>
                  <Input
                    required
                    className="bg-ivory"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-forest">Last Name *</label>
                  <Input
                    required
                    className="bg-ivory"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-forest">Email Address *</label>
                  <Input
                    type="email"
                    required
                    className="bg-ivory"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-forest">Phone Number *</label>
                  <Input
                    required
                    className="bg-ivory"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              {/* Day Selection Ticks in Admin */}
              <div className="rounded-lg border border-line bg-sage/20 p-3 space-y-2">
                <span className="font-bold text-forest block text-xs">
                  Event Days to Issue ID Passes For:
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <label className="flex items-center gap-2 cursor-pointer bg-card p-2 rounded border border-line">
                    <input
                      type="checkbox"
                      checked={formData.day1}
                      onChange={(e) => setFormData({ ...formData, day1: e.target.checked })}
                      className="rounded text-forest"
                    />
                    <span className="font-medium text-[11px]">Day 1 (Free)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer bg-card p-2 rounded border border-line">
                    <input
                      type="checkbox"
                      checked={formData.day2}
                      onChange={(e) => setFormData({ ...formData, day2: e.target.checked })}
                      className="rounded text-forest"
                    />
                    <span className="font-medium text-[11px]">Day 2 (Free)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer bg-amber-50 p-2 rounded border border-amber-300">
                    <input
                      type="checkbox"
                      checked={formData.day3}
                      onChange={(e) => setFormData({ ...formData, day3: e.target.checked })}
                      className="rounded text-amber-600"
                    />
                    <span className="font-bold text-amber-900 text-[11px]">Day 3 (VVIP)</span>
                  </label>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-forest">Category / Affiliation *</label>
                <select
                  value={formData.affiliationType}
                  onChange={(e) => {
                    const val = e.target.value as "individual" | "guest_of" | "corporate";
                    setFormData({
                      ...formData,
                      affiliationType: val,
                      category:
                        val === "guest_of"
                          ? "Guest of Member"
                          : val === "corporate"
                          ? "Corporate Guest"
                          : "Individual Attendee",
                    });
                  }}
                  className="w-full rounded-md border border-line bg-ivory p-2"
                >
                  <option value="individual">Individual Attendee</option>
                  <option value="guest_of">Guest of Member / Dignitary</option>
                  <option value="corporate">Corporate Guest</option>
                </select>
              </div>

              {formData.affiliationType === "guest_of" && (
                <div className="space-y-1 rounded-md border border-gold/40 bg-gold/10 p-2.5">
                  <label className="font-semibold text-forest">Host / Member Name *</label>
                  <Input
                    required
                    placeholder="e.g. Chief Adeleke, Patron Bello"
                    className="bg-ivory"
                    value={formData.hostName}
                    onChange={(e) => setFormData({ ...formData, hostName: e.target.value })}
                  />
                </div>
              )}

              {formData.affiliationType === "corporate" && (
                <div className="space-y-1 rounded-md border border-gold/40 bg-gold/10 p-2.5">
                  <label className="font-semibold text-forest">Company or Organization *</label>
                  <Input
                    required
                    placeholder="e.g. First Bank of Nigeria"
                    className="bg-ivory"
                    value={formData.organization}
                    onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                  />
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="autoApprove"
                  checked={formData.autoApprove}
                  onChange={(e) => setFormData({ ...formData, autoApprove: e.target.checked })}
                  className="rounded text-forest"
                />
                <label htmlFor="autoApprove" className="text-xs text-forest">
                  Auto-approve and immediately issue cryptographic QR ID passes
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-line">
                <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="bg-forest text-ivory hover:bg-forest-interactive"
                >
                  {isPending ? "Saving..." : "Save Participant"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 2: EDIT PARTICIPANT ── */}
      {editingParticipant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-line bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="font-serif text-lg font-semibold text-forest">Edit Participant</h3>
              <button
                onClick={() => setEditingParticipant(null)}
                className="text-muted-brand hover:text-forest font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-forest">First Name *</label>
                  <Input
                    required
                    className="bg-ivory"
                    value={editingParticipant.first_name}
                    onChange={(e) =>
                      setEditingParticipant({ ...editingParticipant, first_name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-forest">Last Name *</label>
                  <Input
                    required
                    className="bg-ivory"
                    value={editingParticipant.last_name}
                    onChange={(e) =>
                      setEditingParticipant({ ...editingParticipant, last_name: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-forest">Email Address *</label>
                  <Input
                    type="email"
                    required
                    className="bg-ivory"
                    value={editingParticipant.email}
                    onChange={(e) =>
                      setEditingParticipant({ ...editingParticipant, email: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-forest">Phone Number *</label>
                  <Input
                    required
                    className="bg-ivory"
                    value={editingParticipant.phone}
                    onChange={(e) =>
                      setEditingParticipant({ ...editingParticipant, phone: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-forest">Category</label>
                <Input
                  className="bg-ivory"
                  value={editingParticipant.category}
                  onChange={(e) =>
                    setEditingParticipant({ ...editingParticipant, category: e.target.value })
                  }
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-line">
                <Button type="button" variant="outline" onClick={() => setEditingParticipant(null)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="bg-forest text-ivory hover:bg-forest-interactive"
                >
                  {isPending ? "Updating..." : "Update Participant"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 3: WHATSAPP & EMAIL BROADCAST STATION ── */}
      {isBroadcastOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl border border-line bg-card p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-lg bg-[#25D366] text-white flex items-center justify-center shadow-xs">
                  <WhatsAppIcon className="size-4" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-forest">
                    Tournament Broadcast &amp; Alert Dispatch
                  </h3>
                  <p className="text-[11px] text-muted-brand">
                    Option 1: WhatsApp (Primary) · Option 2: Email (Fallback) · 2,500 Attendees Scale
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsBroadcastOpen(false);
                  setBroadcastResponse(null);
                }}
                className="text-muted-brand hover:text-forest text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              {/* Channel Architecture Banner */}
              <div className="rounded-xl border border-emerald-300 bg-emerald-50/80 p-3 text-emerald-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div>
                  <div className="font-bold flex items-center gap-1.5 text-xs text-emerald-900">
                    <Radio className="size-3.5 text-emerald-700 animate-pulse" />
                    <span>Transmission Architecture: Option 1 Primary + Option 2 Fallback</span>
                  </div>
                  <p className="text-[11px] text-emerald-800 mt-0.5">
                    1. <strong>WhatsApp (Primary):</strong> Dispatches instant ticket credentials, turnstile instructions, and daily schedule updates directly via Secretariat WhatsApp Business.
                    <br />
                    2. <strong>Email (Fallback):</strong> Delivers comprehensive HTML programme backup and ensures 100% reachability.
                  </p>
                </div>
              </div>

              {/* Broadcast Type Selector */}
              <div className="space-y-1.5">
                <label className="font-semibold text-forest">Select Tournament Alert Template:</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setBroadcastType("weekly")}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                      broadcastType === "weekly"
                        ? "border-[#25D366] bg-emerald-50 text-emerald-950 font-bold"
                        : "border-line bg-ivory text-muted-brand hover:border-emerald-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold">Weekly Countdown Brief</span>
                      <Badge className="bg-emerald-800 text-[9px]">General</Badge>
                    </div>
                    <p className="text-[10px] font-normal mt-1 opacity-80">
                      Countdown update, 2,500 attendance goal, and 3-page schedule PDF link.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setBroadcastType("daily");
                      setBroadcastDay(1);
                    }}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                      broadcastType === "daily" && broadcastDay === 1
                        ? "border-[#25D366] bg-emerald-50 text-emerald-950 font-bold"
                        : "border-line bg-ivory text-muted-brand hover:border-emerald-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold">Day 1 Morning Brief</span>
                      <Badge className="bg-emerald-600 text-[9px]">Free Entry</Badge>
                    </div>
                    <p className="text-[10px] font-normal mt-1 opacity-80">
                      Media Tour, Light-Up Ceremony, 100% Free Public Admission confirmation.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setBroadcastType("daily");
                      setBroadcastDay(2);
                    }}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                      broadcastType === "daily" && broadcastDay === 2
                        ? "border-[#25D366] bg-emerald-50 text-emerald-950 font-bold"
                        : "border-line bg-ivory text-muted-brand hover:border-emerald-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold">Day 2 Morning Brief</span>
                      <Badge className="bg-forest text-[9px]">Royal Opening</Badge>
                    </div>
                    <p className="text-[10px] font-normal mt-1 opacity-80">
                      Royal opening by HRM Alake of Egbaland, 3 foundation layings, Queens Polo.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setBroadcastType("daily");
                      setBroadcastDay(3);
                    }}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                      broadcastType === "daily" && broadcastDay === 3
                        ? "border-amber-500 bg-amber-50 text-amber-950 font-bold"
                        : "border-line bg-ivory text-muted-brand hover:border-amber-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold">Day 3 Grand Finale Brief</span>
                      <Badge className="bg-amber-600 text-[9px]">Paid VVIP</Badge>
                    </div>
                    <p className="text-[10px] font-normal mt-1 opacity-80">
                      Royal Cup Finals, 100 Kings Celebration, ARISTOS BAND & BERRYOLA.
                    </p>
                  </button>
                </div>
              </div>

              {/* Test Phone & Email Section */}
              <div className="rounded-xl border border-line bg-ivory p-3 space-y-2">
                <span className="font-semibold text-forest block">
                  Send Test Broadcast (Recommended First Step):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Input
                    placeholder="Admin WhatsApp: e.g. 0803 123 4567"
                    className="bg-card text-xs"
                    value={broadcastTestPhone}
                    onChange={(e) => setBroadcastTestPhone(e.target.value)}
                  />
                  <Input
                    placeholder="Admin Email: e.g. admin@abeokutapolo2026.ng"
                    className="bg-card text-xs"
                    value={broadcastTestEmail}
                    onChange={(e) => setBroadcastTestEmail(e.target.value)}
                  />
                </div>
                <div className="flex justify-end pt-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={broadcastLoading}
                    onClick={() => handleTriggerBroadcast(true)}
                    className="border-emerald-600 text-emerald-800 hover:bg-emerald-50 text-xs cursor-pointer"
                  >
                    <Send className="mr-1 size-3 text-emerald-600" />
                    {broadcastLoading ? "Dispatching Test..." : "Send Test Alert (Option 1 WhatsApp + Option 2 Email)"}
                  </Button>
                </div>
              </div>

              {/* Bulk Dispatch Station */}
              <div className="rounded-xl border border-amber-300 bg-amber-50/60 p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <span className="font-bold text-amber-950 block">Bulk Attendees Dispatch:</span>
                  <span className="text-[11px] text-amber-900">
                    Dispatches to all {participants.length} registered attendees in the database.
                  </span>
                </div>
                <Button
                  type="button"
                  size="sm"
                  disabled={broadcastLoading}
                  onClick={() => handleTriggerBroadcast(false)}
                  className="bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs px-4 py-2 cursor-pointer shadow-sm shrink-0"
                >
                  <WhatsAppIcon className="mr-1.5 size-3.5" />
                  {broadcastLoading ? "Dispatching Bulk..." : "Dispatch to All Attendees"}
                </Button>
              </div>

              {/* Dispatch Response Display */}
              {broadcastResponse && (
                <div className="rounded-xl border border-line bg-card p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-forest flex items-center gap-1.5">
                      <CheckCircle2 className="size-4 text-emerald-600" />
                      Dispatch Results &amp; Delivery Telemetry:
                    </span>
                    <Badge className="bg-emerald-800 text-[10px]">
                      {broadcastResponse.channelStrategy || "WhatsApp Primary"}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                    <div className="p-2 rounded bg-ivory border">
                      <div className="text-[10px] text-muted-brand">Processed</div>
                      <div className="text-base font-bold text-forest">{broadcastResponse.totalProcessed ?? 0}</div>
                    </div>
                    <div className="p-2 rounded bg-emerald-50 border border-emerald-200">
                      <div className="text-[10px] text-emerald-800">WhatsApp Sent</div>
                      <div className="text-base font-bold text-emerald-800">{broadcastResponse.whatsappPrimarySent ?? 0}</div>
                    </div>
                    <div className="p-2 rounded bg-emerald-50 border border-emerald-200">
                      <div className="text-[10px] text-emerald-800">WhatsApp Queued</div>
                      <div className="text-base font-bold text-emerald-800">{broadcastResponse.whatsappQueued ?? 0}</div>
                    </div>
                    <div className="p-2 rounded bg-ivory border">
                      <div className="text-[10px] text-muted-brand">Email Fallbacks</div>
                      <div className="text-base font-bold text-forest">{broadcastResponse.emailsSent ?? 0}</div>
                    </div>
                  </div>

                  {/* Direct WhatsApp Instant Links Queue */}
                  {broadcastResponse.whatsappDirectLinks && broadcastResponse.whatsappDirectLinks.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <span className="font-semibold text-forest text-[11px] block">
                        Instant WhatsApp Direct Click-to-Chat Queue ({broadcastResponse.whatsappDirectLinks.length}):
                      </span>
                      <div className="max-h-36 overflow-y-auto space-y-1 rounded border border-line bg-ivory p-2">
                        {broadcastResponse.whatsappDirectLinks.map((item, idx: number) => (
                          <div key={idx} className="flex items-center justify-between text-[11px] py-1 border-b border-line/60 last:border-b-0">
                            <span className="truncate max-w-[200px] font-medium text-forest">
                              {item.name} ({item.passCode})
                            </span>
                            <Button
                              asChild
                              size="sm"
                              className="h-6 bg-[#25D366] hover:bg-[#20ba59] text-white text-[10px] px-2"
                            >
                              <a href={item.url} target="_blank" rel="noopener noreferrer">
                                <WhatsAppIcon className="mr-1 size-2.5" /> Open Chat
                              </a>
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Logs Viewer */}
                  {broadcastResponse.logs && (
                    <div className="max-h-28 overflow-y-auto rounded bg-black/80 p-2 font-mono text-[10px] text-emerald-400 space-y-0.5">
                      {broadcastResponse.logs.map((log: string, i: number) => (
                        <div key={i}>{log}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
