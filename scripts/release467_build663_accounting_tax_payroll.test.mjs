import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {readAccountingReadiness663} from '../functions/api/admin/accounting-sales-tax-filing.js';

const text=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const handler=text('functions/api/admin/accounting-sales-tax-filing.js');
const page=text('admin/accounting/index.html');
const client=text('public/js/admin-accounting-operations.js');
const manifest=JSON.parse(text('.well-known/rosevear-integration-manifest.json'));
const requiredBooks=['accounting_order_record_id','order_id','order_number','entry_status','customer_name','customer_email','currency','total_cents','amount_paid_cents','amount_outstanding_cents','tax_liability_cents','source_order_status','source_payment_status','created_at','updated_at'];
const requiredTax=['reconciliation_type','period_month','scope_key','review_status','note','statement_reference','detail_json','reference_amount_cents','book_amount_cents','statement_amount_cents','difference_cents'];
function database(ready=true){
 return {prepare(sql){
   let args=[];
   return {bind(...values){args=values;return this},
     async first(){
       if(sql.includes('sqlite_master'))return ready?{name:args[0]}:null;
       if(sql.includes('COUNT(*) AS records_count'))return {records_count:1,total_booked_cents:3000,total_paid_cents:2200,total_outstanding_cents:800,total_tax_cents:390,open_records_count:1};
       if(sql.includes('accounting_reconciliation_reviews WHERE'))return {review_status:'draft',detail_json:JSON.stringify({tax_collected_cents:390,input_tax_cents:125,net_tax_payable_cents:265,order_count:1,expense_count:1}),statement_reference:'PRIVATE_REFERENCE',note:'CUSTOMER_PRIVATE'};
       throw Error('Unexpected original source SQL: '+sql.slice(0,55));
     },
     async all(){
       if(sql.includes('PRAGMA table_info(accounting_order_records)'))return {results:requiredBooks.map(name=>({name}))};
       if(sql.includes('PRAGMA table_info(accounting_reconciliation_reviews)'))return {results:requiredTax.map(name=>({name}))};
       if(sql.includes('FROM accounting_order_records'))return {results:[{order_id:12,customer_name:'PRIVATE CUSTOMER',customer_email:'secret@example.test',total_cents:3000}]};
       throw Error('Unexpected original read: '+sql.slice(0,60));
     }
   };
 }};
}
test('actual source amounts are returned without customer identity, notes or statement references',async()=>{
 const data=await readAccountingReadiness663(database(),'2026-11');
 assert.equal(data.ok,true);
 assert.equal(data.build,663);
 assert.equal(data.financials.summary.total_booked_cents,3000);
 assert.equal(data.financials.period_scope,'ALL_TIME_NOT_FILTERED');
 assert.equal(data.financials.currency_scope,'UNVERIFIED');
 assert.equal(data.sales_tax.worksheet.net_tax_payable_cents,265);
 assert.equal(data.sales_tax.filing_verified,false);
 assert.equal(data.payroll.remittance_enabled,false);
 assert.equal(data.readiness.master_completion_percent,null);
 const serialized=JSON.stringify(data);
 for(const forbidden of ['PRIVATE CUSTOMER','secret@example.test','CUSTOMER_PRIVATE','PRIVATE_REFERENCE'])assert.ok(!serialized.includes(forbidden),forbidden);
});
test('missing original schemas stay unknown and on HOLD, never fake zero totals',async()=>{
 const data=await readAccountingReadiness663(database(false),'2026-11');
 assert.equal(data.financials.schema_ready,false);
 assert.equal(data.financials.summary,null);
 assert.equal(data.sales_tax.worksheet,null);
 assert.equal(data.readiness.independently_certified,false);
});
test('GET-only readiness mode cannot mutate payroll, taxes, ledger or sources',()=>{
 assert.match(handler,/mode.*readiness/);
 assert.match(handler,/verifiedAdminFromModule/);
 assert.match(handler,/getAdminUserFromRequest/);
 assert.match(handler,/periodValid/);
 assert.match(handler,/no_payroll_run:true/);
 assert.match(handler,/no_journal_post:true/);
 assert.match(handler,/no_master_event:true/);
 assert.doesNotMatch(handler,/INSERT INTO|UPDATE app_settings|CREATE TABLE|ALTER TABLE|DROP TABLE/);
 assert.match(client,/accounting663Mount/);
 assert.match(client,/mode=readiness/);
 assert.match(client,/currency unverified/);
 assert.doesNotMatch(client,/method:\s*['"]POST['"]/);
});
test('phone/tablet accounting review keeps original Finance UI and CRA links',()=>{
 assert.match(page,/accountingOperationsMount/);
 assert.match(page,/accounting663Mount/);
 assert.match(page,/@media\(max-width:700px\)/);
 assert.match(page,/min-height:44px/);
 assert.match(client,/aria-live="polite"/);
 assert.match(client,/canada\.ca\/en\/revenue-agency/);
});
test('Devil n Dove remains an owned business source with external Master Shell HOLD',()=>{
 assert.equal(manifest.source_id,'devilndove');
 assert.equal(manifest.source_role,'business_shell');
 assert.equal(manifest.audience,'rosevear-master');
 assert.equal(manifest.connection_state,'DISCONNECTED / HOLD');
 assert.equal(manifest.signature.key_id,null);
 assert.equal(manifest.transport.origin,null);
});
