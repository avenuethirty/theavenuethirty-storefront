export function toTypeSlug(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// Display label for a raw sheet tagline. Mixed-case values ("Necklace Sets")
// are kept verbatim; all-caps / all-lowercase values ("MATHA PATI", "chains")
// are title-cased so pills, h1s, and chips read consistently.
export function formatTypeLabel(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;
  const isPlainCase =
    trimmed === trimmed.toLowerCase() || trimmed === trimmed.toUpperCase();
  if (!isPlainCase) return trimmed;
  return trimmed
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
