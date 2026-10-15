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

async function main() {
  const email = 'admin@abeokutapolo2026.ng';
  const password = 'PoloFestival2026!Secure';

  console.log(`Checking if admin user exists (${email})...`);
  const { data: usersData, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error('Error listing users:', listError.message);
    process.exit(1);
  }

  let user = usersData.users.find(u => u.email === email);
  if (!user) {
    console.log(`Creating user ${email}...`);
    const { data: createData, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: 'Super Administrator' }
    });
    if (createError) {
      console.error('Failed to create user:', createError.message);
      process.exit(1);
    }
    user = createData.user;
    console.log(`User created with ID: ${user.id}`);
  } else {
    console.log(`User already exists with ID: ${user.id}. Updating password...`);
    await supabase.auth.admin.updateUserById(user.id, {
      password,
      email_confirm: true,
      user_metadata: { full_name: 'Super Administrator' }
    });
  }

  console.log('Ensuring profile and super_admin role assignment in database...');
  // 1. Profile
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: user.id,
      email: email,
      full_name: 'Super Administrator',
      role: 'super_admin'
    }, { onConflict: 'id' });

  if (profileError) {
    console.warn('Profile upsert note:', profileError.message);
  } else {
    console.log('Profile configured as super_admin.');
  }

  // 2. User role assignment
  const { data: existingRoles } = await supabase
    .from('user_role_assignments')
    .select('id')
    .eq('user_id', user.id)
    .eq('role_key', 'super_admin')
    .is('revoked_at', null);

  if (!existingRoles || existingRoles.length === 0) {
    const { error: roleInsertError } = await supabase
      .from('user_role_assignments')
      .insert({
        user_id: user.id,
        role_key: 'super_admin',
        granted_reason: 'System Super Admin Bootstrap'
      });
    if (roleInsertError) {
      console.warn('Role assignment insert error:', roleInsertError.message);
    } else {
      console.log('Role assignment (super_admin) granted successfully.');
    }
  } else {
    console.log('Role assignment (super_admin) already exists.');
  }

  console.log('\n=========================================');
  console.log('ADMIN ACCOUNT PROVISIONED SUCCESSFULLY:');
  console.log(`Email:    ${email}`);
  console.log(`Password: ${password}`);
  console.log(`Role:     super_admin`);
  console.log('=========================================\n');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
