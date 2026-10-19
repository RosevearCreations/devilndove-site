import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const css=readFileSync(new URL('../css/styles.css',import.meta.url),'utf8');
const block=css.split('/* DEVIL N DOVE — BRAND V3 COPPER / PURPLE CONTINUITY')[1];
test('brand v3 extends the deployed signature design without missing media fetches',()=>{
 assert.ok(block,'brand v3 CSS block');
 for(const token of ['--dd-ink','--dd-night-plum','--dd-purple','--dd-purple-bright',
                     '--dd-copper','--dd-antique-gold','--dd-cream','--dd-mist'])
   assert.ok(block.includes(token+':'),token);
 assert.doesNotMatch(block,/!important|url\(|https?:\/\//,'no CSS forced overrides or references to undelivered images');
 assert.match(block,/focus-visible/);
});
test('brand v3 preserves earlier CSS signature',()=>{
 assert.match(css,/Devil n Dove Signature Design V1/);
 assert.match(css,/grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
});
