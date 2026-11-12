import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Staff accounts to provision. PASSWORDS ARE NEVER STORED IN THE REPOSITORY —
// supply them through the environment, e.g.
//   ADMIN_PW_SUPERADMIN=... ADMIN_PW_PRESIDENT=... node scripts/create_admin_user.mjs
// Any account without a password in the environment is skipped.
const passwordFor = (key) => (process.env[`ADMIN_PW_${key}`] || "").trim();

const ACCOUNTS_TO_PROVISION = [
  {
    email: 'superadmin@abeokutapolo2026.ng',
    password: passwordFor('SUPERADMIN'),
    role: 'super_admin',
    fullName: 'Super Administrator (Executive Governance)',
    url: '/abawole',
    scope: 'Full Governance + Admin Creation/Removal (/abawole/admins)',
  },
  {
    email: 'president@abeokutapolo2026.ng',
    password: passwordFor('PRESIDENT'),
    role: 'president',
    fullName: 'Club President (Executive Operations)',
    url: '/abawole',
    scope: 'Full Operations: Registrations, Finance, Turnstiles, Reports',
  },
  {
    email: 'secretary@abeokutapolo2026.ng',
    password: passwordFor('SECRETARY'),
    role: 'general_secretary',
    fullName: 'General Secretary (Secretariat Operations)',
    url: '/abawole',
    scope: 'Full Operations: Registrations, Communications, Reports, Gate Checks',
  },
  {
    email: 'finsec@abeokutapolo2026.ng',
    password: passwordFor('FINSEC'),
    role: 'finance_officer',
    fullName: 'Financial Secretary (Accounts & Treasury Operations)',
    url: '/abawole',
    scope: 'Finance & Accounts: Bank Wire Reconciliations, Gate Fees, Commitments Ledger',
  },
  {
    email: 'gate@abeokutapolo2026.ng',
    password: passwordFor('GATE'),
    role: 'security_checkin_officer',
    fullName: 'Gate Marshal (Turnstile Ingress Officer)',
    url: '/scan',
    scope: 'Turnstile Scanner PWA only (Zero access to /abawole or finance)',
  },
];

async function ensureRolesAndPermissions() {
  console.log('Ensuring roles and permissions exist in database catalog...');

  // 1. Ensure permissions
  const { error: permError } = await supabase.from('permissions').upsert([
    { code: 'admin.manage', description: 'Exclusive right to manage administrators' }
  ], { onConflict: 'code' });
  if (permError) console.warn('Permissions seed notice:', permError.message);

  // 2. Ensure roles
  const rolesToSeed = [
    { key: 'super_admin', description: 'All platform permissions' },
    { key: 'president', description: 'Club President - Full operational access' },
    { key: 'general_secretary', description: 'General Secretary - Full operational access' },
    { key: 'security_checkin_officer', description: 'Gate Turnstile Validation' },
  ];

  const { error: roleError } = await supabase.from('roles').upsert(rolesToSeed, { onConflict: 'key' });
  if (roleError) console.warn('Roles seed notice:', roleError.message);
}

async function provisionAccount(acc) {
  console.log(`\n--- Provisioning ${acc.role.toUpperCase()}: ${acc.email} ---`);

  const { data: usersData, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error(`Error listing users for ${acc.email}:`, listError.message);
    throw listError;
  }

  let user = usersData.users.find(u => u.email.toLowerCase() === acc.email.toLowerCase());

  if (!user) {
    console.log(`Creating auth user ${acc.email}...`);
    const { data: createData, error: createError } = await supabase.auth.admin.createUser({
      email: acc.email,
      password: acc.password,
      email_confirm: true,
      user_metadata: { full_name: acc.fullName }
    });
    if (createError) {
      console.error(`Failed to create ${acc.email}:`, createError.message);
      throw createError;
    }
    user = createData.user;
    console.log(`User created with ID: ${user.id}`);
  } else {
    console.log(`User already exists with ID: ${user.id}. Updating password and metadata...`);
    const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
      password: acc.password,
      email_confirm: true,
      user_metadata: { full_name: acc.fullName }
    });
    if (updateError) {
      console.error(`Failed to update ${acc.email}:`, updateError.message);
      throw updateError;
    }
    user = updateData.user;
  }

  // 1. Profile
  console.log(`Upserting profile for ${acc.email}...`);
  const profilePayload = {
    id: user.id,
    email: acc.email,
    full_name: acc.fullName,
    is_active: true
  };
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({ ...profilePayload, role: acc.role }, { onConflict: 'id' });

  if (profileError) {
    const { error: fallbackError } = await supabase
      .from('profiles')
      .upsert(profilePayload, { onConflict: 'id' });
    if (fallbackError) {
      console.warn(`Profile upsert notice (${acc.email}):`, fallbackError.message);
    } else {
      console.log(`Profile configured successfully for ${acc.email} (role assigned via user_role_assignments).`);
    }
  } else {
    console.log(`Profile configured with role: ${acc.role}`);
  }

  // 2. User role assignment
  const { data: existingRoles } = await supabase
    .from('user_role_assignments')
    .select('id, role_key')
    .eq('user_id', user.id)
    .eq('role_key', acc.role)
    .is('revoked_at', null);

  if (!existingRoles || existingRoles.length === 0) {
    const { error: roleInsertError } = await supabase
      .from('user_role_assignments')
      .insert({
        user_id: user.id,
        role_key: acc.role,
        granted_reason: `System Bootstrap: ${acc.fullName}`
      });
    if (roleInsertError) {
      console.warn(`Role assignment insert error (${acc.email}):`, roleInsertError.message);
    } else {
      console.log(`Role assignment (${acc.role}) granted successfully.`);
    }
  } else {
    console.log(`Role assignment (${acc.role}) is already active.`);
  }

  return user;
}

async function main() {
  await ensureRolesAndPermissions();

  for (const acc of ACCOUNTS_TO_PROVISION) {
    if (!acc.password) {
      console.log(
        `\nSKIPPED ${acc.email} — no password supplied (set ADMIN_PW_<ROLE> in the environment)`,
      );
      continue;
    }
    await provisionAccount(acc);
  }

  console.log('\n========================================================================================');
  console.log('ADMINISTRATIVE & TURNSTILE ACCOUNTS PROVISIONED:');
  console.log('========================================================================================');
  for (const acc of ACCOUNTS_TO_PROVISION) {
    console.log(`Persona:   ${acc.fullName}`);
    console.log(`Role:      ${acc.role}`);
    console.log(`Login URL: ${acc.url}`);
    console.log(`Email:     ${acc.email}`);
    console.log(`Password:  ${acc.password ? "(supplied via environment)" : "(not supplied — skipped)"}`);
    console.log(`Scope:     ${acc.scope}`);
    console.log('----------------------------------------------------------------------------------------');
  }
}

main().catch(err => {
  console.error('Fatal error during provisioning:', err);
  process.exit(1);
});
