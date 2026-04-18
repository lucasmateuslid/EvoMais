import type { SupabaseClient } from '@supabase/supabase-js';

function normalizeName(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function buildBaseInstanceName(displayName: string) {
  return `${normalizeName(displayName) || 'vendedor'}-wa`;
}

export async function generateUniqueConnectionInstanceName(
  supabase: SupabaseClient,
  organizationId: string,
  displayName: string,
) {
  const base = buildBaseInstanceName(displayName);

  const { data, error } = await supabase
    .from('connections')
    .select('instance_name')
    .eq('organization_id', organizationId)
    .like('instance_name', `${base}%`);

  if (error) {
    throw error;
  }

  const existingNames = new Set(
    (data || [])
      .map(row => String(row.instance_name || '').trim())
      .filter(Boolean),
  );

  if (!existingNames.has(base)) {
    return base;
  }

  let suffix = 2;
  while (existingNames.has(`${base}-${suffix}`)) {
    suffix += 1;
  }

  return `${base}-${suffix}`;
}
