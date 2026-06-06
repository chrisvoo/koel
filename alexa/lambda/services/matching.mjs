export function fuzzyMatch(a, b) {
  if (!a || !b) {
    return false;
  }
  return a.toLowerCase().includes(b.toLowerCase())
    || b.toLowerCase().includes(a.toLowerCase());
}

export function findBestMatch(items, name, nameExtractor = (item) => item.name) {
  if (!items || !items.length || !name) {
    return null;
  }

  const lower = name.toLowerCase();

  const exact = items.find((item) => nameExtractor(item).toLowerCase() === lower);
  if (exact) {
    return exact;
  }

  const substring = items.find(
    (item) => nameExtractor(item).toLowerCase().includes(lower)
      || lower.includes(nameExtractor(item).toLowerCase()),
  );

  return substring || null;
}
