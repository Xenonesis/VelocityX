/**
 * Domain parsing and pattern matching for per-site rules
 */

export function extractHostname(urlOrLocation: string | Location): string {
  try {
    if (typeof urlOrLocation === "object" && urlOrLocation !== null && "hostname" in urlOrLocation) {
      return (urlOrLocation.hostname || "").toLowerCase().trim();
    }
    const raw = String(urlOrLocation).trim();
    if (!raw) return "";

    // If bare domain without protocol is passed
    const urlString = raw.includes("://") ? raw : `https://${raw}`;
    const parsed = new URL(urlString);
    return (parsed.hostname || "").toLowerCase().trim();
  } catch {
    return "";
  }
}

/**
 * Matches hostname against a domain pattern:
 * - Exact: "youtube.com" matches "youtube.com" (or optional leading www)
 * - Wildcard: "*.coursera.org" matches "sub.coursera.org" and "coursera.org"
 */
export function matchesDomainPattern(pattern: string, hostname: string): boolean {
  const normPattern = pattern.toLowerCase().trim();
  const normHost = hostname.toLowerCase().trim();

  if (!normPattern || !normHost) return false;

  // Direct match or www equivalence
  if (normPattern === normHost) return true;
  if (normHost === `www.${normPattern}` || `www.${normHost}` === normPattern) return true;

  // Wildcard subdomain prefix (e.g. *.example.com)
  if (normPattern.startsWith("*.")) {
    const rootDomain = normPattern.slice(2);
    if (normHost === rootDomain) return true;
    if (normHost.endsWith(`.${rootDomain}`)) return true;
  }

  return false;
}
