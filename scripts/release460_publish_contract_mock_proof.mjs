import assert from 'node:assert/strict';
import { buildProviderPublicationPlan, listProviderPublicationContracts } from '../functions/api/_lib/socialPublishContracts.js';

const originalFetch = globalThis.fetch;
let fetchCalls = 0;
globalThis.fetch = async () => {
  fetchCalls += 1;
  throw new Error('Release 460 publication validation attempted forbidden provider network execution');
};

const secretMarker = 'provider-secret-must-never-appear';
const subjectMarker = 'provider-subject-must-never-appear';

const samples = {
  etsy: {
    title: 'Handmade workshop piece', description: 'A factual reviewed listing draft prepared locally.', price: 24.95, quantity: 2,
    tags: ['handmade', 'ontario', 'workshop'], image_urls: ['https://devilndove.com/media/example-etsy.jpg'], product_reference: 'product-101'
  },
  pinterest: {
    title: 'Workshop finish', description: 'A local preview for a reviewed image Pin.',
    image_urls: ['https://devilndove.com/media/example-pin.jpg'], link_url: 'https://devilndove.com/shop/'
  },
  meta: {
    surface: 'facebook_page', caption: 'A reviewed Devil n Dove workshop update.',
    image_urls: ['https://devilndove.com/media/example-meta.jpg'], link_url: 'https://devilndove.com/workshop-journal/'
  },
  x: {
    caption: 'A reviewed workshop update prepared locally.',
    image_urls: ['https://devilndove.com/media/example-x.jpg'], link_url: 'https://devilndove.com/'
  },
  tiktok: {
    caption: 'A reviewed short-form workshop video draft.', video_url: 'https://devilndove.com/media/example-tiktok.mp4'
  },
  youtube: {
    title: 'Workshop process short', description: 'A reviewed upload draft.', video_url: 'https://devilndove.com/media/example-youtube.mp4', privacy_intent: 'private_review'
  }
};

try {
  const contracts = listProviderPublicationContracts();
  assert.deepEqual(contracts.map((item) => item.provider), ['etsy', 'pinterest', 'meta', 'x', 'tiktok', 'youtube']);
  for (const contract of contracts) {
    assert.equal(contract.execution_boundary.validation_only, true);
    assert.equal(contract.execution_boundary.provider_execution, false);
    assert.equal(contract.execution_boundary.provider_publication, false);
    assert.equal(contract.execution_boundary.network_calls_allowed, false);
    assert.equal(contract.execution_boundary.token_material_required, false);
  }

  for (const [provider, base] of Object.entries(samples)) {
    const input = {
      ...base,
      destination_alias: 'devil-n-dove-primary',
      access_token: secretMarker,
      refresh_token: secretMarker,
      client_secret: secretMarker,
      remote_subject_id: subjectMarker,
      provider_subject_id: subjectMarker,
    };
    const first = await buildProviderPublicationPlan(provider, input);
    assert.equal(first.valid, true, `${provider} sample should validate`);
    assert.equal(first.provider, provider);
    assert.match(first.idempotency.key, new RegExp(`^r460_${provider}_[A-Za-z0-9_-]{20,}$`));
    assert.equal(first.idempotency.deterministic, true);
    assert.equal(first.idempotency.duplicate_of_prior_key, false);
    assert.equal(first.idempotency.disposition, 'new_or_revised');
    assert.equal(first.execution_boundary.validation_only, true);
    assert.equal(first.execution_boundary.provider_execution, false);
    assert.equal(first.execution_boundary.provider_publication, false);
    assert.equal(first.execution_boundary.network_calls_allowed, false);
    assert.equal(first.provider_subject_values_emitted, false);
    assert.equal(first.secret_values_emitted, false);
    const serialized = JSON.stringify(first);
    assert.equal(serialized.includes(secretMarker), false, `${provider} leaked ignored secret material`);
    assert.equal(serialized.includes(subjectMarker), false, `${provider} leaked provider subject material`);

    const second = await buildProviderPublicationPlan(provider, { ...input });
    assert.equal(second.idempotency.key, first.idempotency.key, `${provider} idempotency key changed for identical normalized intent`);

    const duplicate = await buildProviderPublicationPlan(provider, { ...input, prior_idempotency_keys: [first.idempotency.key] });
    assert.equal(duplicate.idempotency.key, first.idempotency.key);
    assert.equal(duplicate.idempotency.duplicate_of_prior_key, true);
    assert.equal(duplicate.idempotency.disposition, 'duplicate_blocked');

    const revisedInput = provider === 'youtube'
      ? { ...input, title: `${input.title} revised` }
      : provider === 'etsy' || provider === 'pinterest'
        ? { ...input, title: `${input.title} revised` }
        : { ...input, caption: `${input.caption || ''} revised` };
    const revised = await buildProviderPublicationPlan(provider, revisedInput);
    assert.notEqual(revised.idempotency.key, first.idempotency.key, `${provider} revised content did not receive a new idempotency key`);
  }

  const instagram = await buildProviderPublicationPlan('instagram', {
    surface: 'instagram_business', caption: 'Instagram business preview.', image_urls: ['https://devilndove.com/media/ig.jpg']
  });
  assert.equal(instagram.provider, 'meta');
  assert.equal(instagram.valid, true);
  assert.equal(instagram.destination.surface, 'instagram_business');

  const invalidPinterest = await buildProviderPublicationPlan('pinterest', { title: 'Missing image', description: 'This must fail locally.' });
  assert.equal(invalidPinterest.valid, false);
  assert.equal(invalidPinterest.errors.some((item) => item.code === 'public_https_image_required'), true);

  const invalidTikTok = await buildProviderPublicationPlan('tiktok', { caption: 'Missing video' });
  assert.equal(invalidTikTok.valid, false);
  assert.equal(invalidTikTok.errors.some((item) => item.code === 'public_https_video_required'), true);

  await assert.rejects(() => buildProviderPublicationPlan('unsupported-provider', {}), /provider_publication_provider_unsupported/);
  assert.equal(fetchCalls, 0, 'provider publication validation made a forbidden network call');
  console.log('RELEASE 460 PROVIDER PUBLICATION VALIDATION + IDEMPOTENCY MOCK PROOF: PASS');
} finally {
  globalThis.fetch = originalFetch;
}
