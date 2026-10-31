/* Build 539: restore the original D1-backed ingredient/maker editor in Product
 * Editor. No automatic D1 reads, Etsy POSTs, duplicates or publication. */
import {reviewSavedInci539} from './product-ingredient-review-539.mjs';
const byId = (id) => document.getElementById(id);
const productId = Number(new URLSearchParams(location.search).get('product_id') || 0);
const ingredientsPanel = document.querySelector('[data-editor-panel="ingredients"]');
const sourcePanel = byId('dd538Pilot');
const pilotMount = byId('dd539PilotMount');

if (ingredientsPanel) {
  const isSweetOrange = productId === 54;
  const factsPanel = ingredientsPanel.querySelector('.dd539-etsy-facts');
  if (factsPanel) factsPanel.hidden = !isSweetOrange;
  if (sourcePanel && pilotMount) pilotMount.append(sourcePanel);

  const open = (tab) => document.querySelector(`[data-editor-tab="${tab}"]`)?.click();
  byId('dd539OpenIngredients')?.addEventListener('click', () => {
    open('ingredients');
    ingredientsPanel.scrollIntoView({ block: 'start', behavior: 'smooth' });
  });
  byId('dd539OpenAdvanced')?.addEventListener('click', () => {
    const details = byId('dd527MoreTools');
    if (details) details.open = true;
    open('advanced');
    document.querySelector('[data-editor-panel="advanced"]')?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  });
  byId('dd539LoadIngredients')?.addEventListener('click', async (event) => {
    const button = event.currentTarget;
    button.disabled = true;
    try {
      // This large legacy module must stay OFF the Product Editor startup path.
      await import('/public/js/admin-product-resources.js?v=539');
      const load = byId('productResourcesLoadButton');
      if (!load) throw Error('Ingredient editor did not initialize.');
      load.click();
    } catch (error) {
      const status = byId('dd539InciStatus');
      if (status) status.textContent = `Ingredient editor unavailable: ${String(error?.message || error)} No records changed.`;
    } finally { button.disabled = false; }
  });

  if (isSweetOrange) {
    const inciStatus = byId('dd539InciStatus');
    byId('dd539UseSavedInci')?.addEventListener('click', async (event) => {
      const button = event.currentTarget;
      if (button.disabled) return;
      const input = byId('dd538Ingredients');
      if (!input || !window.DDAuth?.apiFetch) {
        inciStatus.textContent = 'The original ingredient form is not ready. No changes saved.';
        return;
      }
      if (input.value.trim()) {
        inciStatus.textContent = 'The Sweet Orange ingredient field already has text. To protect our edits, nothing was replaced. Review or clear it first if we want to copy saved INCI names.';
        return;
      }
      button.disabled = true;
      inciStatus.textContent = 'Checking saved ingredient label profiles for this Product (read only)…';
      try {
        const response = await window.DDAuth.apiFetch('/api/admin/product-resources?product_id=54', { method: 'GET', cache: 'no-store' });
        const result = await window.DDAuth.readApiJson(response, { fallbackMessage: 'Ingredient profiles unavailable.' });
        if (!result?.ok) throw Error(result?.error || 'Ingredient profile readback unavailable.');
        const reviewed = reviewSavedInci539(result.links, productId);
        input.value = reviewed.ingredients;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        inciStatus.textContent = `Copied ${reviewed.count} saved INCI names for review only. Compare every ingredient and its order to the actual Sweet Orange label, enter measured net weight, then check owner confirmation before Fill and Save Product. Nothing posted to Etsy.`;
      } catch (error) {
        inciStatus.textContent = `Ingredient copy stopped: ${String(error?.message || error)} No field was overwritten and nothing was sent to Etsy.`;
      } finally { button.disabled = false; }
    });

    const liveStatus = byId('dd539LiveStatus');
    const liveEvidence = byId('dd539LiveEvidence');
    const sourceStatus = byId('dd535LiveStatus');
    const sourceEvidence = byId('dd535LiveEvidence');
    const copyLive = () => {
      if (sourceStatus && liveStatus) liveStatus.textContent = sourceStatus.textContent || 'No verified Etsy readback.';
      if (sourceEvidence && liveEvidence) {
        liveEvidence.replaceChildren(...Array.from(sourceEvidence.querySelectorAll('li')).map((item) => {
          const li = document.createElement('li');
          li.textContent = item.textContent;
          return li;
        }));
      }
    };
    if (sourceStatus && sourceEvidence) {
      new MutationObserver(copyLive).observe(sourceStatus, { characterData: true, childList: true, subtree: true });
      new MutationObserver(copyLive).observe(sourceEvidence, { characterData: true, childList: true, subtree: true });
      copyLive();
    }
    byId('dd539VerifyLive')?.addEventListener('click', () => {
      const read = byId('dd535ReadLive');
      if (read) read.click();
      else if (liveStatus) liveStatus.textContent = 'Live Etsy readback control is unavailable. No Etsy write made.';
    });
  }
}
