// Build 444: pure, conservative input rules; no public URL or provider publication.
export const DESIGN_EXTENSIONS = new Set(['stl','3mf','svg','dxf','gcode','nc','step','stp','obj','pdf','png','jpg','jpeg','webp','zip']);
export const LICENSES = new Set(['own_work','licensed','third_party_reference','unknown']);
export const READINESS = new Set(['unreviewed','needs_changes','ready']);
export const MAX_DESIGN_BYTES = 12 * 1024 * 1024;

export function positiveId(value) {
  const n = Number(value);
  return Number.isSafeInteger(n) && n > 0 ? n : 0;
}
export function designKey(value) {
  const v = String(value ?? '').trim().toLowerCase();
  return /^[a-z0-9][a-z0-9_-]{1,79}$/.test(v) ? v : '';
}
export function extensionFor(filename) {
  const name = String(filename ?? '').trim();
  const match = /^[^\x00-\x1f/\\]{1,180}\.([a-z0-9]+)$/i.exec(name);
  const ext = match?.[1]?.toLowerCase() || '';
  return DESIGN_EXTENSIONS.has(ext) ? ext : '';
}
export function requestKey(value) {
  const key = String(value ?? '').trim();
  return /^[a-zA-Z0-9_-]{20,96}$/.test(key) ? key : '';
}
export function safeFilename(value) {
  return String(value ?? 'design-file').replace(/[\r\n"\\/\x00-\x1f]/g, '_').slice(0, 180) || 'design-file';
}
export function approvalAllowed(revision) {
  return revision?.machine_readiness === 'ready'
    && ['own_work','licensed'].includes(revision?.source_license)
    && (revision.source_license !== 'licensed' || String(revision.source_note || '').trim().length >= 12);
}
