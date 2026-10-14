import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {etsyException,productPriceException,normalizeOperatorDecision,cleanReference} from '../functions/api/_lib/etsyOperatorExceptions395.mjs';
const source=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const now=Date.parse('2026-10-13T22:00:00Z'), at=n=>new Date(now+n*86400000).toISOString();
const connected={connection_status:'connected',access_expires_at:at(2),refresh_expires_at:at(15),updated_at:at(-1)};
const shop={acceptance_status:'connected_verified',verified_at:at(-1)};
test('connected shop stays healthy even if historic callback attempt failed',()=>{
 const r=etsyException(connected,shop,{terminal_status:'failed',diagnostic_code:'TOKEN=secret'},now);
 assert.equal(r.active,false);assert.equal(r.code,'historical_callback_review');
 assert.doesNotMatch(JSON.stringify(r),/secret|TOKEN=/);
 assert.equal(r.provider_called,false);assert.equal(r.listing_written,false);
});
test('expired refresh cannot be called resolved',()=>{
 const r=etsyException({...connected,refresh_expires_at:at(-1)},shop,null,now);
 assert.equal(r.code,'authorization_expired');assert.equal(r.active,true);
 assert.equal(r.health_status,'reauthorization_required');
});
test('unknown and stale states require explicit operator review',()=>{
 assert.equal(etsyException(connected,{acceptance_status:'unverified'},null,now).active,true);
 assert.equal(etsyException(connected,{...shop,verified_at:at(-40)},null,now).code,'verification_stale');
 assert.equal(etsyException({connection_status:'disconnected'},shop,null,now).code,'connection_disconnected');
});
test('missing approved source and observed price difference are not called proven corruption',()=>{
 assert.equal(productPriceException({product_id:9,price_cents:0,currency:'CAD'},null).code,'source_evidence_required');
 assert.equal(productPriceException({product_id:9,price_cents:0,currency:'CAD'},{receipt_id:4,approved_price_cents:800}).code,'source_price_discrepancy');
 assert.equal(productPriceException({product_id:9,price_cents:0,currency:'CAD'},{receipt_id:4,approved_price_cents:0}).active,false);
 assert.equal(productPriceException({product_id:9,price_cents:800,currency:'USD'},null).code,'unsupported_price_state');
});
test('decisions require exact fingerprint, safe evidence reference and explicit confirmation',()=>{
 const ok={scope:'etsy',fingerprint:'etsy|authorization_expired|reauthorization_required|none|none',decision:'acknowledge',operator_reference:'TICKET-395-123',
  request_key:'abcd1234567890efabcd',operator_confirmed:true};
 assert.equal(normalizeOperatorDecision(ok).decision,'acknowledge');
 assert.equal(normalizeOperatorDecision({...ok,operator_confirmed:false}),null);
 assert.equal(normalizeOperatorDecision({...ok,operator_reference:'Bearer token 123'}),null);
 assert.equal(normalizeOperatorDecision({...ok,request_key:'1'}),null);
 assert.equal(normalizeOperatorDecision({...ok,scope:'product',product_id:0}),null);
 assert.equal(cleanReference('Cloudflare Ray 1234'), 'Cloudflare Ray 1234');
});
test('GET never inserts an operator receipt, and POST never mutates products or Etsy',()=>{
 const s=source('functions/api/admin/etsy-monitoring-exceptions.js');
 const get=s.split('export async function onRequestGet')[1]?.split('export async function onRequestPost')[0]||'';
 assert.doesNotMatch(get,/\.run\(|INSERT|UPDATE|DELETE/i);
 assert.match(s,/INSERT INTO admin_action_audit/);
 assert.match(s,/WHERE NOT EXISTS/);
 assert.match(s,/decision_receipt_unknown/);
 assert.match(s,/current\.fingerprint!==input\.fingerprint/);
 assert.match(s,/no_prior_exception/);
 assert.match(s,/unresolved_exception/);
 assert.doesNotMatch(s,/UPDATE products|INSERT INTO products|etsy\.com|redirect.*follow/i);
});
test('operator interface handles wait, evidence reread and no silent retries',()=>{
 const html=source('admin/it-integrations/index.html'),ui=source('public/js/admin-etsy-monitoring-exceptions-v395.js');
 assert.match(html,/id="etsyExceptionRead"/);
 assert.match(ui,/button\.disabled=true/);
 assert.match(ui,/receipt_id/);
 assert.match(ui,/No automatic retry/);
 assert.match(ui,/crypto\.randomUUID/);
});
