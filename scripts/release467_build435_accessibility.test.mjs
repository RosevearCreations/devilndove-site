#!/usr/bin/env node
// Release 467 Build 435 — accessible Standard theme contract, read-only source regression.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const css = fs.readFileSync('css/brand-v3-theme.css','utf8');
const front = fs.readFileSync('css/brand-v3-frontsite-recovery.css','utf8');
const middleware = fs.readFileSync('functions/_middleware.js','utf8');

const rootBlock = css.match(/:root\s*\{([^}]*)\}/)?.[1] || '';
function token(name) {
  const match = rootBlock.match(new RegExp('(?:^|[\\s;])'+name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\s*:\\s*([^;]+);'));
  assert.ok(match, 'missing theme token '+name);
  return match[1].trim();
}
function luminance(hex) {
  assert.match(hex,/^#[a-f\d]{6}$/i);
  const c=hex.slice(1).match(/../g).map(s=>parseInt(s,16)/255)
    .map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);
  return .2126*c[0]+.7152*c[1]+.0722*c[2];
}
function contrast(a,b) {
  const x=luminance(a), y=luminance(b);
  return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);
}
function verifyContrast(label,fg,bg,threshold=4.5) {
  const value=contrast(fg,bg);
  assert.ok(value>=threshold, label+' contrast '+value.toFixed(2)+' is below '+threshold);
}

test('approved Brand V3 colours remain locked',()=>{
  for(const [key,value] of Object.entries({
    '--dd-brand-v3-navy':'#1a1230',
    '--dd-brand-v3-royal':'#2e1b55',
    '--dd-brand-v3-purple':'#5a3a8c',
    '--dd-brand-v3-lavender':'#8b6aa9',
    '--dd-brand-v3-gold':'#d4af37',
    '--dd-brand-v3-ivory':'#f5e6d3',
    '--dd-brand-v3-charcoal':'#0e0b14'
  }))assert.equal(token(key),value,key);
});
test('Standard theme has reusable semantic aliases and 44px touch targets',()=>{
  for(const key of ['canvas','panel','panel-raised','foreground','secondary-text','border',
                     'focus','link','decorative-gold','primary-start','primary-end','radius','touch-target']){
    assert.ok(token('--dd-v3-standard-'+key).length>0,key);
  }
  assert.equal(token('--dd-v3-standard-touch-target'),'44px');
  assert.match(css,/min-height:var\(--dd-v3-standard-touch-target\)/);
});
test('WCAG AA 4.5:1 normal text across dominant Standard theme surfaces',()=>{
  verifyContrast('body text',token('--dd-color-text'),token('--dd-color-bg'));
  verifyContrast('card text',token('--dd-color-text'),token('--dd-color-surface'));
  verifyContrast('muted card text',token('--dd-color-text-muted'),token('--dd-color-surface'));
  verifyContrast('muted raised text',token('--dd-color-text-muted'),token('--dd-color-surface-raised'));
  verifyContrast('primary button start','#ffffff',token('--dd-v3-standard-primary-start'));
  verifyContrast('primary button end','#ffffff',token('--dd-v3-standard-primary-end'));
  verifyContrast('link',token('--dd-color-accent'),token('--dd-color-bg'));
  verifyContrast('focus ring',token('--dd-color-focus'),token('--dd-color-bg'),3);
  verifyContrast('gold accents',token('--dd-brand-v3-gold'),token('--dd-color-surface'),3);
});
test('keyboard focus, interactive labels, input legibility and forced colours are supported',()=>{
  assert.match(css,/\[role="tab"\]/);
  assert.match(css,/\[tabindex\]/);
  assert.match(css,/\[role="button"\]/);
  assert.match(css,/:focus-visible\s*\{/);
  assert.match(css,/outline:3px solid var\(--dd-v3-standard-focus\)/);
  assert.match(css,/outline-offset:3px/);
  assert.match(css,/:focus-within/);
  assert.match(css,/::placeholder\s*\{color:var\(--dd-v3-standard-secondary-text\)/);
  assert.match(css,/@media\(forced-colors:active\)/);
  assert.match(css,/@media\(prefers-contrast:more\)/);
});
test('responsive constraints, reduced motion and genuine owner images are retained',()=>{
  assert.match(css,/@media\(max-width:740px\)/);
  assert.match(css,/@media\(max-width:540px\)/);
  assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
  assert.match(css,/animation-duration:\.01ms!important/);
  assert.match(css,/transition-duration:\.01ms!important/);
  assert.match(css,/\.shop-card-main-image img/);
  assert.match(front,/object-fit:contain/);
  assert.match(css,/Never adjusts real inventory image source/);
  assert.doesNotMatch(css,/url\(["']?\/assets\/images\/brand-v3\/.*\)\s*!important/);
});
test('shared public and Admin paths all load the current Standard theme revision',()=>{
  const tag='brand-v3-theme.css?v=435-standard-accessibility';
  assert.equal(middleware.split(tag).length-1,3);
  assert.equal(middleware.split('data-dd-brand-v3-theme').length-1,3);
  assert.doesNotMatch(middleware,/brand-v3-theme\.css\?v=brand-v3-visual-20261019-set14-fullsite190/);
});
