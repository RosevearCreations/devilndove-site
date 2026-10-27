/* Build 498: one saved Product SEO phrase list, deterministic channel previews.
 * This is metadata preparation, never automatic provider publication or ranking.
 */
export function semanticTags498(value) {
  const phrases = Array.isArray(value) ? value : String(value ?? '').split(',');
  const result = [], seen = new Set(), duplicates = [];
  for (const entry of phrases) {
    const phrase = String(entry ?? '').normalize('NFC').replace(/\s+/gu, ' ').trim();
    if (!phrase) continue;
    const key = phrase.toLocaleLowerCase('en-CA');
    if (seen.has(key)) { duplicates.push(phrase); continue; }
    seen.add(key); result.push(phrase);
  }
  return { phrases: result, duplicates };
}

export function hashtag498(phrase) {
  const words = String(phrase ?? '').normalize('NFKD').replace(/\p{M}/gu, '')
    .match(/[\p{L}\p{N}]+/gu) || [];
  if (!words.length) return '';
  // Platform-specific preparation only: remove spacing, retain word starts.
  return '#' + words.map(word => word[0].toLocaleUpperCase('en-CA') + word.slice(1)).join('');
}

export function channelTags498(value) {
  const { phrases, duplicates } = semanticTags498(value);
  const warnings = [];
  if (duplicates.length) warnings.push(`Duplicate search phrases removed in preview: ${duplicates.join(', ')}. Remove duplicates before saving.`);
  if (phrases.length > 13) warnings.push(`${phrases.length} phrases: Etsy supports at most 13 native tags. Remove or prioritize phrases before an Etsy transfer.`);
  const tooLong = phrases.filter(tag => [...tag].length > 20);
  if (tooLong.length) warnings.push(`Etsy tags longer than 20 characters: ${tooLong.join(', ')}.`);
  const invalid = phrases.filter(tag => !/^[\p{L}\p{Nd}\p{Zs}\-'™©®]+$/u.test(tag));
  if (invalid.length) warnings.push(`Etsy may reject punctuation in: ${invalid.join(', ')}. Review the exact native tag rules before transferring.`);
  const hashtags = [...new Set(phrases.map(hashtag498).filter(Boolean))];
  return {
    canonical: phrases,
    etsy: phrases,
    facebook: phrases,
    google: phrases,
    instagram: hashtags,
    tiktok: hashtags,
    pinterest: phrases,
    youtube: hashtags,
    etsyReady: phrases.length > 0 && phrases.length <= 13 && !duplicates.length && !tooLong.length && !invalid.length,
    warnings,
  };
}
