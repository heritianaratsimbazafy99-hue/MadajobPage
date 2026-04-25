export function getSafeExternalUrl(value: string | null | undefined) {
  const rawValue = value?.trim();

  if (!rawValue) {
    return null;
  }

  try {
    const parsed = new URL(rawValue);

    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return null;
    }

    return parsed.href;
  } catch {
    return null;
  }
}
