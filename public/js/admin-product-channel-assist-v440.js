// Build 440: keep optional channel workflows in their owning tabs.
// Presentation only: no D1 reads, provider calls, writes, or automatic retries.
(() => {
  'use strict';
  const panel = name => document.querySelector(`[data-editor-panel="${name}"]`);
  const channelIntent = document.getElementById('productChannel405');
  const galleryReview = document.getElementById('productDistribution406');
  const legacyAcceptance = document.getElementById('listingSync408');

  if (channelIntent && panel('basics')) {
    channelIntent.classList.add('dd-channel-optional');
    const heading = channelIntent.querySelector('h2');
    if (heading) heading.textContent = 'Optional selling channels';
    panel('basics').append(channelIntent);
  }
  if (galleryReview && panel('media')) {
    galleryReview.classList.add('dd-channel-optional');
    const heading = galleryReview.querySelector('h2');
    if (heading) heading.textContent = 'Optional: approve images for future marketplace publication';
    const note = document.createElement('p');
    note.className = 'small';
    note.textContent = 'These photo approvals are for later distribution. They do not block creation of an unpublished Etsy draft.';
    galleryReview.insertBefore(note, galleryReview.firstChild?.nextSibling || null);
    panel('media').append(galleryReview);
  }
  if (legacyAcceptance && panel('advanced')) {
    const disclosure = document.createElement('details');
    disclosure.className = 'dd-channel-advanced';
    const summary = document.createElement('summary');
    summary.textContent = 'Advanced: legacy local destination acceptance';
    disclosure.append(summary, legacyAcceptance);
    panel('advanced').append(disclosure);
  }

  document.querySelectorAll('[data-editor-jump]').forEach(button => {
    button.addEventListener('click', () => {
      const destination = button.getAttribute('data-editor-jump');
      document.querySelector(`[data-editor-tab="${destination}"]`)?.click();
      if (destination === 'description') {
        document.querySelector('[name="short_description"]')?.focus();
      }
    });
  });
})();
