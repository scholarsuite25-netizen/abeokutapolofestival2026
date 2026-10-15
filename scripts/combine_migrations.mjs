import fs from 'node:fs';
import path from 'node:path';

const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');
const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
console.log('Concatenating migrations:', files);

let combined = `-- ============================================================================
-- 2026 ABEOKUTA POLO FESTIVAL - ALL MIGRATIONS CONSOLIDATED
-- Run this in the Supabase Dashboard -> SQL Editor
-- ============================================================================

`;

for (const file of files) {
  const content = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
  combined += `-- ============================================================================\n-- FILE: ${file}\n-- ============================================================================\n\n` + content + '\n\n';
}

fs.writeFileSync(path.join(process.cwd(), 'supabase', 'APPLY_ALL_MIGRATIONS.sql'), combined, 'utf8');
console.log('Successfully regenerated supabase/APPLY_ALL_MIGRATIONS.sql');
