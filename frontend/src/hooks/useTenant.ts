import { useEffect, useState } from 'react';

import { getCurrentTenantSubdomain } from '../lib/subdomain';
import { tenantService, type TenantInfo } from '../services/tenantService';

export function useTenant() {
  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [subdomain, setSubdomain] = useState<string | null>(() => getCurrentTenantSubdomain());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadTenant() {
      setLoading(true);
      const currentTenant = await tenantService.getCurrentTenant();

      if (!active) return;

      setTenant(currentTenant);
      setSubdomain(getCurrentTenantSubdomain());
      setLoading(false);
    }

    void loadTenant();

    return () => {
      active = false;
    };
  }, []);

  return { tenant, subdomain, loading };
}
