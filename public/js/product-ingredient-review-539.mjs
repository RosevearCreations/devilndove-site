/* Pure saved-resource label review. No Etsy calls or fabricated ingredients. */
export function reviewSavedInci539(links, productId) {
  if (!Number.isSafeInteger(productId) || productId <= 0 || !Array.isArray(links))
    throw Error('The exact saved Product ingredient links are not available.');
  if (links.some((link) => Number(link.product_id) !== productId))
    throw Error('One or more ingredient links belong to a different Product. Stop and verify the record.');
  const labelled = links.filter((link) => Number(link.is_label_ingredient) === 1)
    .sort((a,b) => Number(a.label_sort_order ?? a.sort_order ?? 0) - Number(b.label_sort_order ?? b.sort_order ?? 0));
  if (!labelled.length)
    throw Error('No saved label ingredients are marked for this Product. Load Product resources below and mark each actual label ingredient with its INCI name.');
  const values = labelled.map((link) => String(link.inci_name || '').trim());
  if (values.some((value) => !value || value.length > 160))
    throw Error('At least one saved label ingredient has no valid INCI name. Complete its profile in the original ingredient editor below.');
  if (new Set(values.map((value) => value.toLowerCase())).size !== values.length)
    throw Error('Duplicate INCI names appear in saved label profiles. Review their names and order before using them.');
  return { count: values.length, ingredients: values.join(', ') };
}
