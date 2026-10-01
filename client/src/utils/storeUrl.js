export function getStoreUrl(slug) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/s/${slug}`;
}

export async function copyStoreLink(slug) {
  await navigator.clipboard.writeText(getStoreUrl(slug));
}
