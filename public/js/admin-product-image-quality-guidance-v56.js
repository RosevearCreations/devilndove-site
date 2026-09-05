// Build 56 — human-readable coaching layered onto the existing Product Photography Manager.
(function () {
  'use strict';

  function mountGuide() {
    if (document.getElementById('photoTrainingGuideV56')) return;
    const rubric = document.querySelector('.score-rubric');
    const host = rubric?.closest('section.card') || document.querySelector('.hero')?.nextElementSibling;
    if (!host?.parentNode) return;
    const section = document.createElement('section');
    section.id = 'photoTrainingGuideV56';
    section.className = 'card';
    section.style.marginTop = '18px';
    section.innerHTML = `
      <div class="section-heading-row">
        <div>
          <p class="eyebrow">Build 56 • Photography coaching</p>
          <h2 style="margin:0">How to improve a weak score</h2>
          <p class="small" style="margin:6px 0 0">The score is an objective baseline, not an artistic verdict. Fix the weakest measurable component first, rescore, then make the final hero/gallery decision with human review.</p>
        </div>
        <a class="btn" href="/admin/products/">Open Product Editor</a>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px;margin-top:12px">
        <div><strong>Lighting</strong><p class="small">Use even light, protect highlight detail and keep shadows from collapsing to black. Mixed bright/dark clipping loses points.</p></div>
        <div><strong>Clarity</strong><p class="small">Check focus, camera movement and depth of field. More light and a stable camera usually improve edge detail.</p></div>
        <div><strong>Background</strong><p class="small">Remove seams, clutter and changing tones near the image border. A clean studio background scores more consistently.</p></div>
        <div><strong>Framing</strong><p class="small">Keep the product centred and large enough to read clearly. The heuristic prefers roughly 62% subject occupancy.</p></div>
        <div><strong>Resolution</strong><p class="small">1200 px or more on the shortest side earns full resolution points. Use the best original rather than enlarging a small copy.</p></div>
        <div><strong>Colour</strong><p class="small">Correct white balance and avoid mixed light sources. Strong red/green/blue channel imbalance lowers the deterministic score.</p></div>
        <div><strong>Artifacts</strong><p class="small">Avoid repeated JPEG saves and aggressive compression. Export once from the best source at an appropriate web quality.</p></div>
        <div><strong>Consistency</strong><p class="small">Use a deliberate crop/aspect-ratio family across one Product set unless a different composition is intentionally required.</p></div>
      </div>
      <details style="margin-top:12px">
        <summary><strong>Recommended photography workflow</strong></summary>
        <ol class="small">
          <li>Analyze the current images.</li>
          <li>Open the weakest image and identify its lowest component scores.</li>
          <li>Reshoot or re-edit only what the evidence indicates.</li>
          <li>Rescore the updated image and compare the result.</li>
          <li>Use the highest-scoring distinct image as the leading hero candidate.</li>
          <li>Keep distinct 70+ images as gallery candidates, then review reflections, styling, angle and product appeal manually.</li>
          <li>Treat duplicate flags as review prompts only; never delete automatically.</li>
        </ol>
      </details>`;
    host.insertAdjacentElement('afterend', section);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountGuide);
  else mountGuide();
})();
