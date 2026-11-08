"use client";

import { useState } from "react";
import { 
  ShieldCheck, 
  UserPlus, 
  KeyRound, 
  Edit3, 
  Copy, 
  Check, 
  Trash2, 
  ShieldAlert, 
  Crown, 
  QrCode, 
  FileText,
  Lock
} from "lucide-react";
import { 
  createAdminAccountAction, 
  updateAdminDetailsAction, 
  resetAdminPasswordAction, 
  revokeAdminRoleAction 
} from "@/app/(admin)/abawole/admins/actions";

export interface AdminUserRecord {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  roles: string[];
  createdAt: string;
  isActive: boolean;
}

const PRESET_CREDENTIALS = [
  {
    title: "Super Admin (You)",
    designation: "Platform Governance & Owner",
    email: "superadmin@abeokutapolo2026.ng",
    password: "PoloSuperAdmin2026#Apex",
    url: "/abawole",
    role: "super_admin",
    badge: "Super Admin",
    badgeColor: "bg-amber-100 text-amber-900 border-amber-300",
    scope: "Full Platform Operations + Exclusive Admin Creation/Removal",
    icon: Crown,
  },
  {
    title: "Admin 1: President",
    designation: "Club President",
    email: "president@abeokutapolo2026.ng",
    password: "PoloPres2026!Executive",
    url: "/abawole",
    role: "president",
    badge: "Executive Admin",
    badgeColor: "bg-emerald-100 text-emerald-900 border-emerald-300",
    scope: "Full Operations: Registrations, Finance, Turnstiles, Reports (No admin manage)",
    icon: ShieldCheck,
  },
  {
    title: "Admin 2: General Secretary",
    designation: "Club General Secretariat",
    email: "secretary@abeokutapolo2026.ng",
    password: "PoloSec2026!Palace",
    url: "/abawole",
    role: "general_secretary",
    badge: "Executive Admin",
    badgeColor: "bg-blue-100 text-blue-900 border-blue-300",
    scope: "Full Operations: Registrations, Protocol, Guest Lists, Reports (No admin manage)",
    icon: FileText,
  },
  {
    title: "Gate Marshal (Turnstile)",
    designation: "Turnstile Ingress Security",
    email: "gate@abeokutapolo2026.ng",
    password: "GateMarshal2026#Access",
    url: "/scan",
    role: "security_checkin_officer",
    badge: "Turnstile Only",
    badgeColor: "bg-purple-100 text-purple-900 border-purple-300",
    scope: "Dedicated /scan Pass Scanning PWA strictly. ZERO access to /abawole or finance.",
    icon: QrCode,
  },
];

export function AdminManagementClient({
  admins,
  currentUserId,
}: {
  admins: AdminUserRecord[];
  currentUserId: string;
}) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminUserRecord | null>(null);
  const [passwordTarget, setPasswordTarget] = useState<AdminUserRecord | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const copyToClipboard = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleCreateSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMsg(null);
    const formData = new FormData(e.currentTarget);
    const res = await createAdminAccountAction(formData);
    setIsSubmitting(false);
    if (res.ok) {
      setStatusMsg({ type: "success", text: res.message || "Created successfully!" });
      setShowCreateModal(false);
    } else {
      setStatusMsg({ type: "error", text: res.error || "Failed to create." });
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMsg(null);
    const formData = new FormData(e.currentTarget);
    const res = await updateAdminDetailsAction(formData);
    setIsSubmitting(false);
    if (res.ok) {
      setStatusMsg({ type: "success", text: res.message || "Updated successfully!" });
      setEditingAdmin(null);
    } else {
      setStatusMsg({ type: "error", text: res.error || "Failed to update." });
    }
  };

  const handlePasswordResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordTarget) return;
    setIsSubmitting(true);
    setStatusMsg(null);
    const formData = new FormData();
    formData.append("userId", passwordTarget.id);
    formData.append("newPassword", newPassword);
    const res = await resetAdminPasswordAction(formData);
    setIsSubmitting(false);
    if (res.ok) {
      setStatusMsg({ type: "success", text: res.message || "Password reset successfully!" });
      setPasswordTarget(null);
      setNewPassword("");
    } else {
      setStatusMsg({ type: "error", text: res.error || "Failed to reset password." });
    }
  };

  const handleRevokeRole = async (userId: string, roleKey: string) => {
    if (!confirm(`Are you sure you want to revoke role "${roleKey}" for this user?`)) return;
    setIsSubmitting(true);
    setStatusMsg(null);
    const formData = new FormData();
    formData.append("userId", userId);
    formData.append("roleKey", roleKey);
    const res = await revokeAdminRoleAction(formData);
    setIsSubmitting(false);
    if (res.ok) {
      setStatusMsg({ type: "success", text: res.message || "Role revoked." });
    } else {
      setStatusMsg({ type: "error", text: res.error || "Failed to revoke." });
    }
  };

  return (
    <div className="space-y-8">
      {/* Alert / Status Toast */}
      {statusMsg && (
        <div
          className={`rounded-xl border p-4 text-sm font-medium transition-all ${
            statusMsg.type === "success"
              ? "border-emerald-300 bg-emerald-50 text-emerald-900"
              : "border-red-300 bg-red-50 text-red-900"
          }`}
        >
          {statusMsg.text}
        </div>
      )}

      {/* 1. Quick Copy Credentials Deck */}
      <div className="rounded-2xl border border-line bg-card p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-line">
          <div>
            <div className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-gold-deep" />
              <h2 className="font-display text-lg font-bold text-forest">
                Copy Assigned Admin &amp; Gate Credentials
              </h2>
            </div>
            <p className="mt-1 text-xs text-muted-brand">
              Assigned login URLs, emails, and passphrases for the 3 Administrators and the Gate Marshal. Click any field to copy.
            </p>
          </div>
          <button
            onClick={() => {
              const summaryText = PRESET_CREDENTIALS.map(
                (c) =>
                  `${c.title} (${c.designation})\nURL: ${c.url}\nEmail: ${c.email}\nPassword: ${c.password}\nScope: ${c.scope}\n`
              ).join("\n----------------------------------------\n\n");
              copyToClipboard("all", summaryText);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-forest/30 bg-forest px-3.5 py-2 text-xs font-semibold text-ivory hover:bg-forest-light transition-colors self-start sm:self-auto shrink-0 shadow-xs"
          >
            {copiedKey === "all" ? <Check className="h-3.5 w-3.5 text-emerald-300" /> : <Copy className="h-3.5 w-3.5 text-gold" />}
            <span>{copiedKey === "all" ? "All Credentials Copied!" : "Copy All 4 Accounts"}</span>
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {PRESET_CREDENTIALS.map((cred) => {
            const Icon = cred.icon;
            return (
              <div
                key={cred.email}
                className="flex flex-col justify-between rounded-xl border border-line bg-sage/20 p-5 hover:border-forest/40 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-forest/10 text-forest">
                        <Icon className="h-4 w-4 text-gold-deep" />
                      </div>
                      <div>
                        <h3 className="font-display text-sm font-bold text-forest">{cred.title}</h3>
                        <p className="text-[11px] text-muted-brand">{cred.designation}</p>
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${cred.badgeColor}`}
                    >
                      {cred.badge}
                    </span>
                  </div>

                  <p className="mt-3 text-xs text-muted-brand leading-relaxed">{cred.scope}</p>

                  <div className="mt-4 space-y-2 rounded-lg bg-card p-3 border border-line text-xs font-mono">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] text-muted-brand font-sans">URL:</span>
                      <button
                        onClick={() => copyToClipboard(`url-${cred.email}`, cred.url)}
                        className="inline-flex items-center gap-1 font-semibold text-forest hover:text-gold transition-colors"
                      >
                        <span>{cred.url}</span>
                        {copiedKey === `url-${cred.email}` ? (
                          <Check className="h-3 w-3 text-emerald-600" />
                        ) : (
                          <Copy className="h-3 w-3 text-muted-brand" />
                        )}
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] text-muted-brand font-sans">Email:</span>
                      <button
                        onClick={() => copyToClipboard(`email-${cred.email}`, cred.email)}
                        className="inline-flex items-center gap-1 text-ink hover:text-gold transition-colors"
                      >
                        <span>{cred.email}</span>
                        {copiedKey === `email-${cred.email}` ? (
                          <Check className="h-3 w-3 text-emerald-600" />
                        ) : (
                          <Copy className="h-3 w-3 text-muted-brand" />
                        )}
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] text-muted-brand font-sans">Password:</span>
                      <button
                        onClick={() => copyToClipboard(`pass-${cred.email}`, cred.password)}
                        className="inline-flex items-center gap-1 text-ink font-semibold hover:text-gold transition-colors"
                      >
                        <span>{cred.password}</span>
                        {copiedKey === `pass-${cred.email}` ? (
                          <Check className="h-3 w-3 text-emerald-600" />
                        ) : (
                          <Copy className="h-3 w-3 text-muted-brand" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Active Platform Administrators Management Table */}
      <div className="rounded-2xl border border-line bg-card p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-line">
          <div>
            <h2 className="font-display text-lg font-bold text-forest">
              Live Provisioned Administrators
            </h2>
            <p className="mt-1 text-xs text-muted-brand">
              As Super Admin, you have exclusive privilege to create, edit designations, reset passwords, or revoke administrator roles.
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-card px-3.5 py-2 text-xs font-semibold text-forest hover:bg-sage/40 transition-colors shadow-xs"
          >
            <UserPlus className="h-3.5 w-3.5 text-gold-deep" />
            <span>Create New Admin</span>
          </button>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-line text-[11px] uppercase tracking-wider text-muted-brand">
                <th className="pb-3 font-semibold">Administrator</th>
                <th className="pb-3 font-semibold">Designated Roles</th>
                <th className="pb-3 font-semibold">Phone / Contact</th>
                <th className="pb-3 font-semibold">Governance Scope</th>
                <th className="pb-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {admins.map((adm) => {
                const isSuper = adm.roles.includes("super_admin");
                const isPres = adm.roles.includes("president");
                const isSec = adm.roles.includes("general_secretary");
                const isGate = adm.roles.includes("security_checkin_officer");
                const isCurrentSelf = adm.id === currentUserId;

                return (
                  <tr key={adm.id} className="hover:bg-sage/15 transition-colors">
                    <td className="py-3.5 pr-4">
                      <div className="font-medium text-ink">{adm.fullName || adm.email}</div>
                      <div className="font-mono text-[11px] text-muted-brand">{adm.email}</div>
                    </td>
                    <td className="py-3.5 pr-4">
                      <div className="flex flex-wrap gap-1">
                        {adm.roles.map((r) => (
                          <span
                            key={r}
                            className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${
                              r === "super_admin"
                                ? "bg-amber-100 text-amber-900 border-amber-300"
                                : r === "president"
                                ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                                : r === "general_secretary"
                                ? "bg-blue-100 text-blue-900 border-blue-300"
                                : "bg-purple-100 text-purple-900 border-purple-300"
                            }`}
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 pr-4 font-mono text-muted-brand">
                      {adm.phone || "—"}
                    </td>
                    <td className="py-3.5 pr-4 text-muted-brand">
                      {isSuper
                        ? "Unlimited Platform Governance & Admin Management"
                        : isPres
                        ? "President: Full Operations (Registrations, Finance, Gates)"
                        : isSec
                        ? "General Secretary: Full Operations (Registrations, Protocol, Gates)"
                        : isGate
                        ? "Gate Turnstile Ingress Scanner (/scan only)"
                        : "Operational Administrator"}
                    </td>
                    <td className="py-3.5 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => setEditingAdmin(adm)}
                          title="Edit Profile & Designation"
                          className="rounded-md border border-line bg-card p-1.5 text-muted-brand hover:text-forest hover:bg-sage/40 transition-colors"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            setPasswordTarget(adm);
                            setNewPassword("");
                          }}
                          title="Reset Password"
                          className="rounded-md border border-line bg-card p-1.5 text-muted-brand hover:text-gold-deep hover:bg-sage/40 transition-colors"
                        >
                          <Lock className="h-3.5 w-3.5" />
                        </button>

                        {!isSuper && !isCurrentSelf && (
                          <button
                            onClick={() => handleRevokeRole(adm.id, adm.roles[0])}
                            title="Revoke Admin Access"
                            className="rounded-md border border-line bg-card p-1.5 text-muted-brand hover:text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Admin Modal */}
      {editingAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-forest-deep/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-line bg-card p-6 shadow-2xl">
            <h3 className="font-display text-base font-bold text-forest">Edit Administrator Details</h3>
            <p className="mt-1 text-xs text-muted-brand">
              Updating designation for: <span className="font-mono">{editingAdmin.email}</span>
            </p>

            <form onSubmit={handleUpdateSubmit} className="mt-4 space-y-4">
              <input type="hidden" name="userId" value={editingAdmin.id} />

              <div>
                <label className="block text-xs font-semibold text-forest mb-1">Full Name</label>
                <input
                  type="text"
                  name="fullName"
                  required
                  defaultValue={editingAdmin.fullName}
                  className="w-full rounded-lg border border-line bg-sage/20 px-3 py-2 text-xs text-ink focus:border-forest focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-forest mb-1">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  defaultValue={editingAdmin.phone || ""}
                  placeholder="+234 803 000 0000"
                  className="w-full rounded-lg border border-line bg-sage/20 px-3 py-2 text-xs text-ink focus:border-forest focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-forest mb-1">Role Classification</label>
                <select
                  name="role"
                  defaultValue={editingAdmin.roles[0] || "president"}
                  className="w-full rounded-lg border border-line bg-sage/20 px-3 py-2 text-xs text-ink focus:border-forest focus:outline-hidden"
                >
                  <option value="president">President (Executive Operations)</option>
                  <option value="general_secretary">General Secretary (Secretariat Operations)</option>
                  <option value="security_checkin_officer">Gate Marshal (Turnstile Ingress Only)</option>
                  <option value="finance_officer">Finance Officer</option>
                  <option value="accreditation_officer">Accreditation Officer</option>
                  <option value="super_admin">Super Admin (Platform Governance)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-line">
                <button
                  type="button"
                  onClick={() => setEditingAdmin(null)}
                  className="rounded-lg border border-line px-3.5 py-1.5 text-xs font-medium text-muted-brand hover:bg-sage/40"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-forest px-4 py-1.5 text-xs font-semibold text-ivory hover:bg-forest-light"
                >
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {passwordTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-forest-deep/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-line bg-card p-6 shadow-2xl">
            <h3 className="font-display text-base font-bold text-forest">Reset Administrator Password</h3>
            <p className="mt-1 text-xs text-muted-brand">
              Enter a new secure password for <span className="font-mono">{passwordTarget.email}</span>.
            </p>

            <form onSubmit={handlePasswordResetSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-forest mb-1">New Password</label>
                <input
                  type="text"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="e.g. PoloPres2026!Executive"
                  className="w-full rounded-lg border border-line bg-sage/20 px-3 py-2 text-xs font-mono text-ink focus:border-forest focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-line">
                <button
                  type="button"
                  onClick={() => setPasswordTarget(null)}
                  className="rounded-lg border border-line px-3.5 py-1.5 text-xs font-medium text-muted-brand hover:bg-sage/40"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || newPassword.length < 8}
                  className="rounded-lg bg-forest px-4 py-1.5 text-xs font-semibold text-ivory hover:bg-forest-light disabled:opacity-50"
                >
                  {isSubmitting ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create New Admin Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-forest-deep/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-line bg-card p-6 shadow-2xl">
            <h3 className="font-display text-base font-bold text-forest">Provision New Administrator</h3>
            <p className="mt-1 text-xs text-muted-brand">
              Add a new official with assigned operational privileges.
            </p>

            <form onSubmit={handleCreateSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-forest mb-1">Email Address</label>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="e.g. protocol@abeokutapolo2026.ng"
                  className="w-full rounded-lg border border-line bg-sage/20 px-3 py-2 text-xs text-ink focus:border-forest focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-forest mb-1">Full Name &amp; Title</label>
                <input
                  type="text"
                  name="fullName"
                  required
                  placeholder="e.g. Chief Protocol Officer"
                  className="w-full rounded-lg border border-line bg-sage/20 px-3 py-2 text-xs text-ink focus:border-forest focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-forest mb-1">Initial Password</label>
                <input
                  type="text"
                  name="password"
                  required
                  minLength={8}
                  placeholder="Min 8 characters"
                  className="w-full rounded-lg border border-line bg-sage/20 px-3 py-2 text-xs font-mono text-ink focus:border-forest focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-forest mb-1">Role Classification</label>
                <select
                  name="role"
                  defaultValue="president"
                  className="w-full rounded-lg border border-line bg-sage/20 px-3 py-2 text-xs text-ink focus:border-forest focus:outline-hidden"
                >
                  <option value="president">President (Executive Operations)</option>
                  <option value="general_secretary">General Secretary (Secretariat Operations)</option>
                  <option value="security_checkin_officer">Gate Marshal (Turnstile Ingress Only)</option>
                  <option value="finance_officer">Finance Officer</option>
                  <option value="accreditation_officer">Accreditation Officer</option>
                  <option value="media_officer">Media Officer</option>
                  <option value="sponsorship_officer">Sponsorship Officer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-forest mb-1">Phone Number (Optional)</label>
                <input
                  type="tel"
                  name="phone"
                  placeholder="+234 803 000 0000"
                  className="w-full rounded-lg border border-line bg-sage/20 px-3 py-2 text-xs text-ink focus:border-forest focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-line">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-lg border border-line px-3.5 py-1.5 text-xs font-medium text-muted-brand hover:bg-sage/40"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-forest px-4 py-1.5 text-xs font-semibold text-ivory hover:bg-forest-light"
                >
                  {isSubmitting ? "Creating..." : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
