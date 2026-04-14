function normalizeHost(hostname: string) {
  return hostname.toLowerCase().trim().replace(/:\d+$/, '');
}

function extractForRootDomain(hostname: string, rootDomain: string) {
  const normalizedHost = normalizeHost(hostname);
  const normalizedRoot = normalizeHost(rootDomain);

  if (!normalizedHost.endsWith(`.${normalizedRoot}`)) {
    return null;
  }

  const candidate = normalizedHost.slice(0, -(`.${normalizedRoot}`.length));
  return candidate || null;
}

export function extractSubdomainFromHostname(hostname: string) {
  if (!hostname) {
    return null;
  }

  const normalized = normalizeHost(hostname);

  if (normalized === 'localhost' || normalized === '127.0.0.1') {
    return null;
  }

  const fromLocal = extractForRootDomain(normalized, 'fulana.local');
  if (fromLocal) {
    return fromLocal;
  }

  const fromProd = extractForRootDomain(normalized, 'fulana.com');
  if (fromProd) {
    return fromProd;
  }

  return null;
}

export function getCurrentTenantSubdomain() {
  if (typeof window === 'undefined') {
    return null;
  }

  return extractSubdomainFromHostname(window.location.hostname);
}
