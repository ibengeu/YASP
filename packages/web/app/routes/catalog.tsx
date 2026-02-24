import CatalogPage from '@yasp/core/pages/CatalogPage';

// OWASP A09:2025 – SSRF: URL validation enforced server-side in /api/fetch-spec;
// this client wrapper only forwards the URL, never accesses internal network directly.
async function webFetchUrl(url: string): Promise<string> {
  const response = await fetch('/api/fetch-spec', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });
  const result = await response.json();
  if (!result.success) throw new Error(result.error);
  return result.content;
}

export default function CatalogRoute() {
  return <CatalogPage fetchUrl={webFetchUrl} />;
}
