import assert from 'node:assert/strict';
import worker,{runPrivacyTick730} from '../workers/privacy-automation-730.mjs';
const disabled=await runPrivacyTick730({DB:{prepare(){throw Error('must not use D1 when disabled')}},DND730_AUTOMATION_ENABLED:'false'});
assert.equal(disabled.status,'HOLD_DISABLED_OR_UNPROVISIONED');
const missingService=await runPrivacyTick730({DB:{prepare(){throw Error('must not access D1 absent service ID')}},DND730_AUTOMATION_ENABLED:'true'});
assert.equal(missingService.status,'HOLD_DISABLED_OR_UNPROVISIONED');
assert.equal((await worker.fetch(new Request('https://example.com'))).status,404);
const fs=await import('node:fs');
const source=fs.readFileSync(new URL('../workers/privacy-automation-730.mjs',import.meta.url),'utf8');
const config=fs.readFileSync(new URL('../wrangler.privacy730.toml',import.meta.url),'utf8');
for(const gate of ['DND730_AUTOMATION_ENABLED','proofCurrent','verifyLiveWithdrawalAck728',
 'dnd_withdrawal_auto_acks_730','dnd_withdrawal_attempts_730','dnd_privacy_schedule_receipts_730',
 "state='LEASED'","m.consent_status IN ('revoked','blocked')"]){
 assert.ok(source.includes(gate),gate);
}
assert.ok(config.includes('DND730_AUTOMATION_ENABLED = "false"'));
assert.ok(config.includes('crons = ["*/15 * * * *"]'));
assert.ok(!source.includes('created_by_user_id'));
console.log('Build730 scheduled Worker disabled default, no public trigger, signed ACK and original consent guards: PASS');
