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
} from "lucide-react";
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
  credentials?: Array<{
    id: string;
    pass_code: string;
    status: string;
    day1_checked_in_at?: string | null;
    day2_checked_in_at?: string | null;
    day3_checked_in_at?: string | null;
  }> | null;
}

interface RegistrationsManagerProps {
  initialParticipants: ParticipantRecord[];
}

export function RegistrationsManager({ initialParticipants }: RegistrationsManagerProps) {
  const [participants, setParticipants] = useState<ParticipantRecord[]>(initialParticipants);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [isPending, startTransition] = useTransition();

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState<ParticipantRecord | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    category: "Individual Attendee",
    groupSize: 1,
    affiliationType: "individual" as "individual" | "guest_of" | "corporate",
    hostName: "",
    organization: "",
    autoApprove: true,
  });

  // Filter logic
  const filtered = participants.filter((p) => {
    const fullName = `${p.first_name} ${p.last_name}`.toLowerCase();
    const query = searchQuery.toLowerCase();
    const cred = p.credentials?.[0];
    const passCode = cred?.pass_code?.toLowerCase() || "";
    const host = (p.host_name || "").toLowerCase();
    const org = (p.organization || "").toLowerCase();

    const matchesSearch =
      fullName.includes(query) ||
      p.email.toLowerCase().includes(query) ||
      p.phone.includes(query) ||
      passCode.includes(query) ||
      host.includes(query) ||
      org.includes(query);

    const matchesCategory =
      selectedCategory === "all" ||
      (selectedCategory === "individual" && (p.affiliation_type === "individual" || p.category.includes("Individual"))) ||
      (selectedCategory === "guest_of" && (p.affiliation_type === "guest_of" || p.category.includes("Guest of"))) ||
      (selectedCategory === "corporate" && (p.affiliation_type === "corporate" || p.category.includes("Corporate")));

    const matchesStatus =
      selectedStatus === "all" ||
      p.status === selectedStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // CSV Export
  const handleExportCSV = () => {
    const headers = [
      "ID",
      "First Name",
      "Last Name",
      "Email",
      "Phone",
      "Category",
      "Affiliation Type",
      "Host Name",
      "Organization",
      "Pass Code",
      "Status",
      "Day 1 Attended",
      "Day 2 Attended",
      "Day 3 Attended",
      "Registered At",
    ];

    const rows = filtered.map((p) => {
      const cred = p.credentials?.[0];
      return [
        p.id,
        `"${p.first_name.replace(/"/g, '""')}"`,
        `"${p.last_name.replace(/"/g, '""')}"`,
        `"${p.email.replace(/"/g, '""')}"`,
        `"${p.phone.replace(/"/g, '""')}"`,
        `"${p.category.replace(/"/g, '""')}"`,
        p.affiliation_type,
        `"${(p.host_name || "").replace(/"/g, '""')}"`,
        `"${(p.organization || "").replace(/"/g, '""')}"`,
        cred?.pass_code || "N/A",
        p.status,
        cred?.day1_checked_in_at ? "YES" : "NO",
        cred?.day2_checked_in_at ? "YES" : "NO",
        cred?.day3_checked_in_at ? "YES" : "NO",
        new Date(p.created_at).toLocaleString(),
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Abeokuta_Polo_Participants_${selectedCategory}_${new Date().toISOString().slice(0, 10)}.csv`
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
      const res = await createParticipantAction(formData);
      if (res.ok) {
        setActionSuccess(`Participant added successfully! ${res.passCode ? `Pass Code: ${res.passCode}` : ""}`);
        setIsAddOpen(false);
        // Refresh local view
        const newRecord: ParticipantRecord = {
          id: crypto.randomUUID(),
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          category: formData.category,
          group_size: formData.groupSize,
          status: formData.autoApprove ? "confirmed" : "pending_approval",
          affiliation_type: formData.affiliationType,
          host_name: formData.hostName || null,
          organization: formData.organization || null,
          created_at: new Date().toISOString(),
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
          category: "General Public Admission",
          groupSize: 1,
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
        groupSize: editingParticipant.group_size,
        affiliationType: editingParticipant.affiliation_type,
        hostName: editingParticipant.host_name || "",
        organization: editingParticipant.organization || "",
      });

      if (res.ok) {
        setActionSuccess("Participant updated successfully.");
        setParticipants((prev) =>
          prev.map((p) => (p.id === editingParticipant.id ? editingParticipant : p))
        );
        setEditingParticipant(null);
      } else {
        setActionError(res.error || "Failed to update participant.");
      }
    });
  };

  // Delete Participant
  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete participant ${name}? This action cascades and deletes their issued credentials.`)) {
      return;
    }
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
          prev.map((p) => (p.id === id ? { ...p, status: "confirmed" } : p))
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
          prev.map((p) => (p.id === id ? { ...p, status: "declined" } : p))
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
          <button onClick={() => setActionSuccess(null)} className="font-bold">×</button>
        </div>
      )}

      {/* Top Controls: Search, Category Filters, Export, Add */}
      <div className="flex flex-col gap-4 rounded-xl border border-line bg-card p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 size-4 text-muted-brand" />
            <Input
              placeholder="Search by name, email, phone, pass code, host, or corporate..."
              className="pl-9 bg-ivory text-xs"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleExportCSV}
              variant="outline"
              size="sm"
              className="border-line text-forest font-semibold"
            >
              <Download className="mr-1.5 size-3.5 text-gold-deep" />
              Download CSV ({filtered.length})
            </Button>
            <Button
              onClick={() => setIsAddOpen(true)}
              size="sm"
              className="bg-forest text-ivory hover:bg-forest-interactive font-semibold"
            >
              <Plus className="mr-1.5 size-3.5" />
              Add Participant
            </Button>
          </div>
        </div>

        {/* Category & Status Filter Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-line/60">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold text-muted-brand mr-1 flex items-center gap-1">
              <Filter className="size-3" /> Category:
            </span>
            {[
              { id: "all", label: "All Categories" },
              { id: "individual", label: "Individual Attendees" },
              { id: "guest_of", label: "Guests of Members" },
              { id: "corporate", label: "Corporate Guests" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  selectedCategory === tab.id
                    ? "bg-forest text-ivory shadow-xs"
                    : "bg-sage/40 text-muted-brand hover:bg-sage hover:text-forest"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-muted-brand">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="rounded-md border border-line bg-ivory px-2 py-1 text-xs text-forest"
            >
              <option value="all">All Statuses</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending_approval">Pending Review</option>
              <option value="declined">Declined</option>
            </select>
          </div>
        </div>
      </div>

      {/* Participants Table */}
      <div className="overflow-hidden rounded-xl border border-line bg-card shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-line bg-sage/30 text-forest font-semibold">
              <tr>
                <th className="px-4 py-3">Participant</th>
                <th className="px-4 py-3">Category &amp; Affiliation</th>
                <th className="px-4 py-3">Access Pass Code</th>
                <th className="px-4 py-3">Daily Attendance</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted-brand">
                    No registered participants found matching your criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const cred = p.credentials?.[0];
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
                          className="border-gold text-gold-deep text-[10px] font-semibold"
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
                            <span className="text-muted-brand">Individual Guest</span>
                          )}
                        </div>
                      </td>

                      {/* Pass Code & Access Card */}
                      <td className="px-4 py-3">
                        {cred?.pass_code ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-forest text-xs">
                              {cred.pass_code}
                            </span>
                            <Link
                              href={`/pass/${cred.pass_code}`}
                              target="_blank"
                              title="View Digital Access Card"
                              className="text-muted-brand hover:text-forest"
                            >
                              <ExternalLink className="size-3.5 text-gold-deep" />
                            </Link>
                          </div>
                        ) : (
                          <span className="text-muted-brand italic">Not yet issued</span>
                        )}
                      </td>

                      {/* 3-Day Attendance Indicators */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-[10px]">
                          <span
                            title="Day 1: Fri 18 Dec"
                            className={`rounded px-1.5 py-0.5 font-semibold ${
                              cred?.day1_checked_in_at
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-gray-100 text-gray-500"
                            }`}
                          >
                            D1: {cred?.day1_checked_in_at ? "In" : "—"}
                          </span>
                          <span
                            title="Day 2: Sat 19 Dec"
                            className={`rounded px-1.5 py-0.5 font-semibold ${
                              cred?.day2_checked_in_at
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-gray-100 text-gray-500"
                            }`}
                          >
                            D2: {cred?.day2_checked_in_at ? "In" : "—"}
                          </span>
                          <span
                            title="Day 3: Sun 20 Dec"
                            className={`rounded px-1.5 py-0.5 font-semibold ${
                              cred?.day3_checked_in_at
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-gray-100 text-gray-500"
                            }`}
                          >
                            D3: {cred?.day3_checked_in_at ? "In" : "—"}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            p.status === "confirmed"
                              ? "bg-emerald-100 text-emerald-800"
                              : p.status === "pending_approval"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {p.status === "confirmed"
                            ? "Confirmed"
                            : p.status === "pending_approval"
                            ? "Pending Review"
                            : "Declined"}
                        </span>
                      </td>

                      {/* Actions: Approve/Deny, Edit, Delete */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {p.status === "pending_approval" && (
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
                            onClick={() => handleDelete(p.id, `${p.first_name} ${p.last_name}`)}
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

      {/* ── MODAL 1: ADD PARTICIPANT ────────────────────────────────────────── */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-line bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="font-display text-lg font-semibold text-forest">Add Participant</h3>
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

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-forest">Category / Affiliation *</label>
                  <select
                    value={formData.affiliationType}
                    onChange={(e) => {
                      const val = e.target.value as "individual" | "guest_of" | "corporate";
                      const catName =
                        val === "guest_of"
                          ? "Guest of Member / Dignitary"
                          : val === "corporate"
                          ? "Corporate Guest"
                          : "Individual Attendee";
                      setFormData({
                        ...formData,
                        affiliationType: val,
                        category: catName,
                      });
                    }}
                    className="w-full rounded-md border border-line bg-ivory p-2"
                  >
                    <option value="individual">Individual Attendee</option>
                    <option value="guest_of">Guest of Member / Dignitary</option>
                    <option value="corporate">Corporate Guest</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-forest">Total Passes (Group Size)</label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    className="bg-ivory"
                    value={formData.groupSize}
                    onChange={(e) =>
                      setFormData({ ...formData, groupSize: parseInt(e.target.value, 10) || 1 })
                    }
                  />
                </div>
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
                  Auto-approve and immediately issue cryptographic QR gate credential
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-line">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddOpen(false)}
                >
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

      {/* ── MODAL 2: EDIT PARTICIPANT ───────────────────────────────────────── */}
      {editingParticipant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-line bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="font-display text-lg font-semibold text-forest">Edit Participant</h3>
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
                <label className="font-semibold text-forest">Category / Affiliation *</label>
                <select
                  value={editingParticipant.affiliation_type}
                  onChange={(e) => {
                    const val = e.target.value as "individual" | "guest_of" | "corporate";
                    const catName =
                      val === "guest_of"
                        ? "Guest of Member / Dignitary"
                        : val === "corporate"
                        ? "Corporate Guest"
                        : "Individual Attendee";
                    setEditingParticipant({
                      ...editingParticipant,
                      affiliation_type: val,
                      category: catName,
                    });
                  }}
                  className="w-full rounded-md border border-line bg-ivory p-2"
                >
                  <option value="individual">Individual Attendee</option>
                  <option value="guest_of">Guest of Member / Dignitary</option>
                  <option value="corporate">Corporate Guest</option>
                </select>
              </div>

              {editingParticipant.affiliation_type === "guest_of" && (
                <div className="space-y-1 rounded-md border border-gold/40 bg-gold/10 p-2.5">
                  <label className="font-semibold text-forest">Host / Member Name</label>
                  <Input
                    className="bg-ivory"
                    value={editingParticipant.host_name || ""}
                    onChange={(e) =>
                      setEditingParticipant({ ...editingParticipant, host_name: e.target.value })
                    }
                  />
                </div>
              )}

              {editingParticipant.affiliation_type === "corporate" && (
                <div className="space-y-1 rounded-md border border-gold/40 bg-gold/10 p-2.5">
                  <label className="font-semibold text-forest">Company or Organization</label>
                  <Input
                    className="bg-ivory"
                    value={editingParticipant.organization || ""}
                    onChange={(e) =>
                      setEditingParticipant({ ...editingParticipant, organization: e.target.value })
                    }
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t border-line">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingParticipant(null)}
                >
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
    </div>
  );
}

