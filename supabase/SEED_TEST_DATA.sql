-- ============================================================================
-- 2026 Abeokuta Polo Festival — Test Data & Executive Committee Seeding
-- Authority: docs/COMMITTEE_STRUCTURE_AND_MEMBERS.md & ARCHITECTURE_PLAN.md
-- ============================================================================

do $$
declare
  v_edition_id uuid;
  v_sec_id uuid;
  v_ops_id uuid;
  v_fin_id uuid;
  v_med_id uuid;
  v_tourn_id uuid;
  v_cont_id uuid;
  v_welf_id uuid;
  
  -- Person record ids
  p_omotoso uuid;
  p_yetunde uuid;
  p_sheriff_adams uuid;
  p_olakunle uuid;
  p_sheriff_abdul uuid;
  p_bada_ishaq uuid;
  p_oduyemi uuid;
  p_dayo_folarin uuid;
  p_imam_thanni uuid;
  p_tomori uuid;
  p_morakinyo uuid;
  p_jide_adeola uuid;
  p_adeola_ajai uuid;
  p_oloyede uuid;
  p_olatunbosun uuid;
  p_gbolahan uuid;
  p_dr_sheriff uuid;
  p_kaloma uuid;
  p_lasile uuid;
  p_tomi_coker uuid;
  p_kehinde_sobayo uuid;
  p_ishaq_bada uuid;

  -- Meeting and task ids
  v_meeting_id uuid;
  v_reg_id uuid;
  v_cred_id uuid;
begin
  -- 1. Ensure Active Festival Edition
  select id into v_edition_id from public.festival_editions where slug = '2026-abeokuta-polo-festival';
  if v_edition_id is null then
    insert into public.festival_editions (name, slug, year, starts_on, ends_on, status)
    values (
      'The Blueprint — 2026 Abeokuta Polo Festival',
      '2026-abeokuta-polo-festival',
      2026,
      '2026-12-18',
      '2026-12-20',
      'published'
    )
    returning id into v_edition_id;
  end if;

  -- 2. Ensure 7 Working Committees
  insert into public.committees (edition_id, slug, name, status)
  values 
    (v_edition_id, 'corporate-secretariat', 'Corporate Secretariat', 'active'),
    (v_edition_id, 'operations-and-logistics', 'Operations and Logistics Committee', 'active'),
    (v_edition_id, 'finance-and-business-development', 'Finance and Business Development Committee', 'active'),
    (v_edition_id, 'media-and-ict', 'Media and ICT Committee', 'active'),
    (v_edition_id, 'tournament', 'Tournament Committee', 'active'),
    (v_edition_id, 'contacts-and-mobilisation', 'Contacts and Mobilisation Committee', 'active'),
    (v_edition_id, 'welfare-entertainment-and-hospitality', 'Welfare, Entertainment and Hospitality Committee', 'proposed')
  on conflict (edition_id, slug) do update set name = excluded.name, status = excluded.status;

  select id into v_sec_id from public.committees where edition_id = v_edition_id and slug = 'corporate-secretariat';
  select id into v_ops_id from public.committees where edition_id = v_edition_id and slug = 'operations-and-logistics';
  select id into v_fin_id from public.committees where edition_id = v_edition_id and slug = 'finance-and-business-development';
  select id into v_med_id from public.committees where edition_id = v_edition_id and slug = 'media-and-ict';
  select id into v_tourn_id from public.committees where edition_id = v_edition_id and slug = 'tournament';
  select id into v_cont_id from public.committees where edition_id = v_edition_id and slug = 'contacts-and-mobilisation';
  select id into v_welf_id from public.committees where edition_id = v_edition_id and slug = 'welfare-entertainment-and-hospitality';

  -- 3. Seed Person Records (Verbatim Source Spelling Preserved)
  insert into public.person_records (edition_id, source_spelling, verified_status, notes)
  values (v_edition_id, 'Mr. S.B Omotoso', 'verified', 'Secretariat & Media/ICT') returning id into p_omotoso;
  
  insert into public.person_records (edition_id, source_spelling, verified_status, notes)
  values (v_edition_id, 'Yetunde Jonathan', 'verified', 'Secretariat') returning id into p_yetunde;

  insert into public.person_records (edition_id, source_spelling, verified_status, notes)
  values (v_edition_id, 'Sheriff Adams', 'verified', 'Secretariat (source variant)') returning id into p_sheriff_adams;

  insert into public.person_records (edition_id, source_spelling, verified_status, notes)
  values (v_edition_id, 'Olakunle Akinsanya', 'verified', 'Secretariat') returning id into p_olakunle;

  insert into public.person_records (edition_id, source_spelling, verified_status, notes)
  values (v_edition_id, 'Sheriff Adams Abdulrahman', 'verified', 'Operations & Finance (source variant)') returning id into p_sheriff_abdul;

  insert into public.person_records (edition_id, source_spelling, verified_status, notes)
  values (v_edition_id, 'Hon. Bada Ishaq', 'verified', 'Operations & Logistics') returning id into p_bada_ishaq;

  insert into public.person_records (edition_id, source_spelling, verified_status, notes)
  values (v_edition_id, 'Chief Dayo Oduyemi', 'verified', 'Operations & Logistics') returning id into p_oduyemi;

  insert into public.person_records (edition_id, source_spelling, verified_status, notes)
  values (v_edition_id, 'Chief Dayo Folarin', 'verified', 'Operations & Contacts') returning id into p_dayo_folarin;

  insert into public.person_records (edition_id, source_spelling, verified_status, notes)
  values (v_edition_id, 'Imam Thanni', 'verified', 'Operations & Logistics') returning id into p_imam_thanni;

  insert into public.person_records (edition_id, source_spelling, verified_status, notes)
  values (v_edition_id, 'Dr. Tomori Popoola', 'verified', 'Operations & Tournament') returning id into p_tomori;

  insert into public.person_records (edition_id, source_spelling, verified_status, notes)
  values (v_edition_id, 'General Morakinyo', 'verified', 'Chairman, Finance & Business Development') returning id into p_morakinyo;

  insert into public.person_records (edition_id, source_spelling, verified_status, notes)
  values (v_edition_id, 'Jide Adeola', 'verified', 'Finance & Business Development') returning id into p_jide_adeola;

  insert into public.person_records (edition_id, source_spelling, verified_status, notes)
  values (v_edition_id, 'Adeola Ajai', 'verified', 'Finance & Business Development') returning id into p_adeola_ajai;

  insert into public.person_records (edition_id, source_spelling, verified_status, notes)
  values (v_edition_id, 'Bar. Oloyede', 'verified', 'Finance & Business Development') returning id into p_oloyede;

  insert into public.person_records (edition_id, source_spelling, verified_status, notes)
  values (v_edition_id, 'Mr. Olatunbosun', 'verified', 'Finance & Business Development') returning id into p_olatunbosun;

  insert into public.person_records (edition_id, source_spelling, verified_status, notes)
  values (v_edition_id, 'Chief Gbolahan Dixon', 'verified', 'Finance & Media') returning id into p_gbolahan;

  insert into public.person_records (edition_id, source_spelling, verified_status, notes)
  values (v_edition_id, 'Dr. Sheriff Adams', 'verified', 'Media & Tournament (source variant)') returning id into p_dr_sheriff;

  insert into public.person_records (edition_id, source_spelling, verified_status, notes)
  values (v_edition_id, 'Babaduna Alli Kaloma', 'verified', 'Tournament Committee') returning id into p_kaloma;

  insert into public.person_records (edition_id, source_spelling, verified_status, notes)
  values (v_edition_id, 'Chief Abiodun Lasile', 'verified', 'Contacts & Mobilisation') returning id into p_lasile;

  insert into public.person_records (edition_id, source_spelling, verified_status, notes)
  values (v_edition_id, 'Hon. Tomi Coker', 'verified', 'Contacts & Mobilisation') returning id into p_tomi_coker;

  insert into public.person_records (edition_id, source_spelling, verified_status, notes)
  values (v_edition_id, 'Chief Mrs Kehinde Sobayo', 'verified', 'Contacts & Mobilisation') returning id into p_kehinde_sobayo;

  insert into public.person_records (edition_id, source_spelling, verified_status, notes)
  values (v_edition_id, 'Hon. Ishaq Bada', 'verified', 'Contacts (source variant)') returning id into p_ishaq_bada;

  -- 4. Committee Memberships Linkage
  -- Corporate Secretariat
  insert into public.committee_memberships (committee_id, person_id, role_key, verified_status)
  values
    (v_sec_id, p_omotoso, 'committee_officer', 'verified'),
    (v_sec_id, p_yetunde, 'committee_member', 'verified'),
    (v_sec_id, p_sheriff_adams, 'committee_member', 'verified'),
    (v_sec_id, p_olakunle, 'committee_member', 'verified');

  -- Operations and Logistics
  insert into public.committee_memberships (committee_id, person_id, role_key, verified_status)
  values
    (v_ops_id, p_sheriff_abdul, 'committee_officer', 'verified'),
    (v_ops_id, p_bada_ishaq, 'committee_member', 'verified'),
    (v_ops_id, p_oduyemi, 'committee_member', 'verified'),
    (v_ops_id, p_dayo_folarin, 'committee_member', 'verified'),
    (v_ops_id, p_imam_thanni, 'committee_member', 'verified'),
    (v_ops_id, p_tomori, 'committee_member', 'verified');

  -- Finance and Business Development
  insert into public.committee_memberships (committee_id, person_id, role_key, verified_status)
  values
    (v_fin_id, p_morakinyo, 'committee_officer', 'verified'),
    (v_fin_id, p_jide_adeola, 'committee_member', 'verified'),
    (v_fin_id, p_adeola_ajai, 'committee_member', 'verified'),
    (v_fin_id, p_oloyede, 'committee_member', 'verified'),
    (v_fin_id, p_olatunbosun, 'committee_member', 'verified'),
    (v_fin_id, p_sheriff_abdul, 'committee_member', 'verified'),
    (v_fin_id, p_gbolahan, 'committee_member', 'verified');

  -- Media and ICT
  insert into public.committee_memberships (committee_id, person_id, role_key, verified_status)
  values
    (v_med_id, p_omotoso, 'committee_officer', 'verified'),
    (v_med_id, p_dr_sheriff, 'committee_member', 'verified'),
    (v_med_id, p_gbolahan, 'committee_member', 'verified');

  -- Tournament Committee
  insert into public.committee_memberships (committee_id, person_id, role_key, verified_status)
  values
    (v_tourn_id, p_dr_sheriff, 'committee_officer', 'verified'),
    (v_tourn_id, p_kaloma, 'committee_member', 'verified'),
    (v_tourn_id, p_tomori, 'committee_member', 'verified');

  -- Contacts and Mobilisation
  insert into public.committee_memberships (committee_id, person_id, role_key, verified_status)
  values
    (v_cont_id, p_lasile, 'committee_officer', 'verified'),
    (v_cont_id, p_tomi_coker, 'committee_member', 'verified'),
    (v_cont_id, p_kehinde_sobayo, 'committee_member', 'verified'),
    (v_cont_id, p_ishaq_bada, 'committee_member', 'verified'),
    (v_cont_id, p_dayo_folarin, 'committee_member', 'verified');

  -- 5. Seed Responsibilities
  insert into public.committee_responsibilities (committee_id, title, body, status)
  values
    (v_sec_id, 'Secretariat Administration', 'Coordinate administrative activities, meetings, correspondence, and official records.', 'approved'),
    (v_sec_id, 'Records & Minutes Custody', 'Maintain minutes, decisions register, and progress reports to leadership.', 'approved'),
    (v_ops_id, 'Venue Infrastructure & Turf Prep', 'Kobape arena preparation, chukker turf aeration, goalposts, safety perimeter boards.', 'approved'),
    (v_ops_id, 'Security & Ingress Coordination', 'State police liaison, VIP security escorts, turnstile gate operations.', 'approved'),
    (v_fin_id, 'Offline Sponsorship Mobilisation', 'Secure headline sponsors, patron endowments, and banking wire covenants.', 'approved'),
    (v_fin_id, 'Fund Management Accountability', 'Maintain offline commitments ledger under the oversight of General Morakinyo.', 'approved'),
    (v_med_id, 'Branding & Tournament Gazette', 'Oversee official festival gazette, press accreditation, and digital web portal.', 'approved'),
    (v_tourn_id, 'Royal Cup Fixtures & Team Accreditations', 'Coordinate Royal Cup, Queens Polo, and novelty matches with polo authorities.', 'approved'),
    (v_cont_id, 'Dignitary & Monarch Mobilisation', 'Coordinate Royal Sovereign Confluence (100 Kings) and VIP diplomatic invitations.', 'approved'),
    (v_welf_id, 'Hospitality & VIP Lounge Receptions', 'Proposed: coordinate guest welfare, chalet catering, and cultural gala performances.', 'proposed');

  -- 6. Seed Operational Tasks
  insert into public.committee_tasks (committee_id, edition_id, title, body, status, priority, due_on)
  values
    (v_sec_id, v_edition_id, 'Collate First Draft of Festival Gazette', 'Assemble historical retrospectives and Alake of Egbaland patron foreword.', 'completed', 'high', '2026-11-01'),
    (v_sec_id, v_edition_id, 'Dispatch Official Assembly Notices', 'Formal convening notices sent to all 7 committee directorates.', 'in_progress', 'medium', '2026-11-15'),
    (v_ops_id, v_edition_id, 'Inspect Kobape Pitch Perimeter Fencing', 'Survey safety boards and equestrian run-off zones with Chief Umpire.', 'completed', 'critical', '2026-10-30'),
    (v_ops_id, v_edition_id, 'Turnstile Scanner PWA Offline Verification', 'Stress-test offline HMAC-SHA256 scanning across 4 gate lanes.', 'in_progress', 'high', '2026-11-10'),
    (v_fin_id, v_edition_id, 'Verify Ogun State Heritage Trust Wire', 'Review direct bank wire confirmation reference OGS-2026-EN-01.', 'completed', 'critical', '2026-10-14'),
    (v_fin_id, v_edition_id, 'Finalize Royal Cup Naming Rights Agreement', 'Corporate draft covenant documentation with Egba Royal Consortium.', 'completed', 'high', '2026-10-20'),
    (v_tourn_id, v_edition_id, 'Publish Tournament Rulebook & Chukker Schedule', 'Confirm 6-chukker progression and handicap thresholds for 8 invitational teams.', 'completed', 'high', '2026-11-05'),
    (v_cont_id, v_edition_id, 'RSVP Protocol for 100 Traditional Rulers', 'Royal Liaison dispatch for palace protocol and Sovereign Dais seating.', 'in_progress', 'critical', '2026-11-18');

  -- 7. Seed Operational Meetings & Minutes
  insert into public.committee_meetings (committee_id, edition_id, title, agenda, starts_at, location, status)
  values (
    v_fin_id,
    v_edition_id,
    'Sponsorship Council Review Session',
    'Review offline sponsor covenants, committee budget allocations, and audited bank wires.',
    '2026-10-12 10:00:00+01',
    'Abeokuta Polo Club Boardroom',
    'held'
  )
  returning id into v_meeting_id;

  insert into public.meeting_minutes (meeting_id, body)
  values (
    v_meeting_id,
    'The Finance and Business Development Committee met under the Chairmanship of General Morakinyo. Headline sponsorship covenants totaling ₦125M confirmed via direct bank wires. Budget allocation parameters for Operations & Logistics (₦45M) and Tournament Directorate (₦35M) formally approved.'
  );

  -- 8. Seed Sample Accredited Guests and Credentials for Gate Scanner Demonstration
  insert into public.registrations (
    edition_id, first_name, last_name, email, phone, category, group_size, status
  )
  values (
    v_edition_id,
    'Oba Adedotun Aremu',
    'Gbadebo, CFR',
    'palace@egbaland.ng',
    '+234 803 000 0001',
    'Royal Patron',
    4,
    'confirmed'
  )
  returning id into v_reg_id;

  insert into public.credentials (
    registration_id, holder_name, token_hash, pass_code, pass_type, zone_access,
    status, check_in_count, first_checked_in_at, last_checked_in_at, last_check_in_gate
  )
  values (
    v_reg_id,
    'Kabiyesi Oba Adedotun Aremu Gbadebo, CFR',
    'f3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4',
    'ABK-2026-ROYAL',
    'Royal Patron',
    array['royal_dais', 'sovereign_pavilion', 'general_lawn'],
    'active',
    1,
    now() - interval '1 hour',
    now() - interval '1 hour',
    'Gate 1 - Royal & VIP Boulevard'
  )
  returning id into v_cred_id;

  -- Add an initial admitted gate check-in event
  insert into public.check_in_events (credential_id, gate, result, details)
  values (
    v_cred_id,
    'Gate 1 - Royal & VIP Boulevard',
    'admitted',
    jsonb_build_object('gate', 'Gate 1 - Royal & VIP Boulevard', 'protocol', 'Sovereign Royal Dais Escort')
  );

end $$;
