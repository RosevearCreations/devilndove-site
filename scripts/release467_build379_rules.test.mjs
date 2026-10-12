import test from 'node:test';import assert from 'node:assert/strict';
import {canTransition,positive,dateValid} from '../functions/api/admin/_lib/workOrderRules.js';
test('rejects jumping ahead and reopening completed',()=>{
 assert.equal(canTransition('not_started','completed'),'INVALID_TRANSITION');
 assert.equal(canTransition('completed','in_progress'),'INVALID_TRANSITION');
 assert.equal(canTransition('ready','in_progress',['not_started']),'DEPENDENCIES_INCOMPLETE');
 assert.equal(canTransition('in_progress','completed',[],0),'REAL_MILESTONE_REQUIRED');
 assert.equal(canTransition('in_progress','completed',['completed'],1),null);
});
test('validates actual dates and integer identity',()=>{
 assert.equal(dateValid('2026-02-29'),false);
 assert.equal(dateValid('2024-02-29'),true);
 assert.equal(positive('13bad'),0);
});
