# Access Control, Roles and Private Information

## Provisional policy
**Hybrid committee access** is a *recommendation pending user confirmation*: verified members may read approved information in their assigned committee, while appointed officers may edit/approve according to delegated rights. Until confirmed, use least privilege and do not activate member accounts automatically.

## Suggested roles
Super Admin; Festival Leadership; Corporate Secretariat Admin; Committee Chair; Committee Secretary; Committee Member; Registration/Accreditation Officer; Security/Check-in Officer; Finance Officer; Sponsorship Officer; Media Editor; Guest; Sponsor Representative; Vendor Representative.

Roles are *not* enough by themselves: enforce granular permissions scoped by festival edition, committee, event, document, guest record and access zone.

| Resource/action | Public | Guest | Committee member | Committee officer | Super Admin |
|---|---|---|---|---|---|
| Approved festival content | Read | Read | Read | Read | Manage |
| Own registration / pass | None | Own only | Own only | Own only | Manage with audit |
| Committee roster | None | None | Assigned committee, approved fields | Assigned committee | All |
| Committee tasks | None | None | Assigned/authorized | Assigned committee manage | All |
| Meeting minutes / internal files | None | None | Explicit grants only | Assigned committee, policy-bound | All with audit |
| Financial records | None | None | None by default | Finance-authorized only | Authorized global access |
| Sponsorship leads and contracts | Public offers only | None | None by default | Authorized sponsorship/finance | All |
| Guest/stakeholder contact directory | None | Own only | None by default | Need-to-know assignments | Controlled global access |
| Invite issuance and QR validation | None | Own pass only | None by default | Explicit accreditation/security grants | Manage |
| CMS publication | Read | Read | None by default | Media approver/editor grants | Manage |
| User roles/permission grants | None | None | None | None by default | Manage |

## Security controls
1. Protect routes AND server actions AND SQL queries. Client-side hiding is not authorization.
2. Use Supabase RLS on every sensitive table; deny anonymous access by default.
3. Keep committee attachments and contracts in private storage; signed URLs expire.
4. Audit privileged reads/changes where appropriate, and all permission changes, pass overrides, payments and exports.
5. Restrict bulk export and use consent/retention controls for contact lists.
6. No automatic user creation from committee names; verify identity and invitation acceptance.
7. Do not store payment card details; verify webhook signatures and idempotency.
8. QR tokens must be unpredictable, revocable and validated server-side with event/zone/time entitlements.
9. Consider Nigeria Data Protection Act obligations; obtain local legal review before launch.
10. Prevent cross-edition data leaks with edition-scoped policies and queries.
