// Devil n Dove Build 291 Packaging Studio compatibility adapter.
// The mature Packaging domain implementation now lives in the shared server service.
// This legacy route remains a compatibility surface for Build 291; it owns no write logic.

import {
  onRequestGet as loadLegacyPackagingStudio,
  onRequestPost as executePackagingWrite,
} from '../_lib/packagingDomainService.js';

export async function onRequestGet(context) {
  return loadLegacyPackagingStudio(context);
}

export async function onRequestPost(context) {
  return executePackagingWrite(context);
}
