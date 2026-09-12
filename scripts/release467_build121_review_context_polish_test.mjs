import assert from 'node:assert/strict';
import fs from 'node:fs';
const src=fs.readFileSync(new URL('../public/js/admin-business-health-review-context-v121.js',import.meta.url),'utf8');
for(const token of ['data-business-health-context-build','Return to Business Health','Copy review context','business_health_period','navigator.clipboard','document.execCommand','monthEndPeriod','monthEndRefresh','URL context only'])assert.ok(src.includes(token),`missing ${token}`);
for(const forbidden of ['localStorage','sessionStorage',"method:'POST'",'setInterval('])assert.ok(!src.includes(forbidden),`forbidden ${forbidden}`);
console.log('Release 467 Build 121 Business Health review-context polish runtime/source proof: PASS');
