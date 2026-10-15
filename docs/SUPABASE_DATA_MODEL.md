# Supabase Data Model — Architecture Requirements

Use PostgreSQL migrations and seed files. This is a design brief, not executable SQL. Produce an ERD and precise RLS policies before implementation.

## Identity / access
`profiles` (verified person and optional auth user linkage), `roles`, `permissions`, `role_permissions`, `user_role_assignments` (scope-aware), `audit_logs`.

**Important:** provisional named committee roster entries may be unverified contacts; keep a separate `people`/`person_records` entity with source spelling and optional verified profile link. Never treat raw name matches as proof of identity.

## Festival
`festival_editions`, `venues`, `festival_events`, `event_schedules`, `event_participants`, `programme_versions`, `publication_approvals`.

## Governance
`committees` (edition-scoped), `committee_responsibilities`, `committee_positions`, `committee_memberships` (person_id, committee_id, position, verified status, start/end dates), `committee_tasks`, `task_assignments`, `committee_meetings`, `meeting_attendees`, `meeting_minutes`, `committee_decisions`, `committee_documents`, `committee_reports`, `committee_announcements`, `committee_activity_logs`.

## Registration, invitation and access
`guest_profiles`, `registrations`, `registration_groups`, `invitations`, `invitation_recipients`, `access_credentials` (store token hash where applicable), `access_zones`, `credential_entitlements`, `checkin_records`, `notification_deliveries`.

## Commercial
`sponsors`, `sponsorship_packages`, `sponsorship_properties`, `sponsorship_package_slots`, `sponsorship_enquiries`, `sponsorship_agreements`, `sponsorship_benefits`, `benefit_fulfilments`, `ticket_products`, `ticket_orders`, `tickets`, `payments`, `payment_events`, `hospitality_reservations`, `vendors`.

## CMS
`cms_pages`, `news_articles`, `media_assets`, `announcements`, `seo_metadata`, `content_revisions`.

## Non-negotiable design details
- Foreign keys, unique constraints, referential integrity, indexes, timestamps, soft-delete/archive where appropriate.
- `festival_edition_id` on edition-scoped records.
- Many-to-many person-to-committee with per-membership position.
- Granular scoped role grants; policy checks for record-level visibility.
- Private storage and signed URLs; no public committee bucket.
- Transaction-safe sponsor slot reservations and ticket inventory.
- Payment idempotency and verified webhook handling.
- Atomic check-in and duplicate protection; reconcile offline events.
- Publish-only approved event content to anonymous users.
- Store seed records as provisional; do not seed actual auth users or passwords for named committee members.
- Provide migrations, sample seed, RLS policy tests and rollback instructions.
