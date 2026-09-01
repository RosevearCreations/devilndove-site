#!/usr/bin/env python3
"""Assemble SELECT-only Development evidence for Release 466 Build 4.

This proof verifies that the existing external-acceptance authorities are present and reports
truthful acceptance counts. Missing real browser/provider evidence is a HOLD, not a source-proof
failure. Use --strict-external only after deliberate operator-controlled acceptance is complete.
"""
from __future__ import annotations
import argparse,json
from pathlib import Path

REQUIRED_TABLE_FLAGS=(
 'it_provider_readiness_checks_table','it_provider_readiness_events_table','provider_setup_authorities_table',
 'payment_refunds_table','creative_asset_access_grants_table','creative_asset_access_audit_table',
 'oauth_provider_connections_table','oauth_security_events_table'
)

def find_row(value):
 if isinstance(value,dict):
  if all(key in value for key in REQUIRED_TABLE_FLAGS):return value
  for child in value.values():
   found=find_row(child)
   if found:return found
 if isinstance(value,list):
  for child in value:
   found=find_row(child)
   if found:return found
 return None

def n(row,key):
 try:return int(row.get(key) or 0)
 except:return 0

def main():
 p=argparse.ArgumentParser();p.add_argument('--d1',required=True);p.add_argument('--source-sha',required=True);p.add_argument('--output',required=True);p.add_argument('--strict-external',action='store_true');args=p.parse_args()
 data=json.loads(Path(args.d1).read_text(encoding='utf-8'));row=find_row(data)
 if not row:raise SystemExit('Build 4 Development D1 evidence row not found')
 missing=[key.removesuffix('_table') for key in REQUIRED_TABLE_FLAGS if n(row,key)!=1]
 if missing:raise SystemExit(f'Build 4 required Development authorities missing: {missing}')
 stripe_total=n(row,'stripe_required_checks');stripe_passed=n(row,'stripe_passed_checks');stripe_refunds=n(row,'stripe_successful_provider_refunds')
 paypal_total=n(row,'paypal_required_checks');paypal_passed=n(row,'paypal_passed_checks');paypal_refunds=n(row,'paypal_successful_provider_refunds')
 caip_range=n(row,'caip_range_acceptance_rows')
 selected_social=n(row,'selected_social_providers')
 social_connections=n(row,'selected_social_connections')
 social_security=n(row,'selected_social_security_events')
 stripe_ok=stripe_total==6 and stripe_passed==6 and stripe_refunds>0
 paypal_ok=paypal_total==6 and paypal_passed==6 and paypal_refunds>0
 caip_ok=caip_range>0
 social_ok=selected_social>0 and social_connections>=selected_social and social_security>0
 external_ok=all((stripe_ok,paypal_ok,caip_ok,social_ok))
 state='EXTERNAL_ACCEPTANCE_COMPLETE' if external_ok else 'HOLD_EXTERNAL_ACCEPTANCE'
 evidence={
  'release':466,'build':4,'status':'PASS','source_sha':args.source_sha,'environment':'development','schema_change':False,
  'required_authorities':{key.removesuffix('_table'):True for key in REQUIRED_TABLE_FLAGS},
  'acceptance_observations':{
   'stripe':{'required_checks':stripe_total,'passed_checks':stripe_passed,'successful_provider_refunds':stripe_refunds,'accepted_by_evidence':stripe_ok},
   'paypal':{'required_checks':paypal_total,'passed_checks':paypal_passed,'successful_provider_refunds':paypal_refunds,'accepted_by_evidence':paypal_ok},
   'caip_private_media':{'qualifying_range_audits':caip_range,'accepted_by_audit':caip_ok},
   'social_oauth':{'selected_providers':selected_social,'selected_provider_connections':social_connections,'selected_provider_security_events':social_security,'runtime_evidence_present':social_ok},
  },
  'payment_acceptance_contract':{
   'required_checks_per_provider':6,
   'refund_is_derived_from_real_provider_sync':True,
   'local_only_refund_counts_as_external_acceptance':False,
   'provider_refund_ids_emitted':False,
  },
  'launch_state':state,
  'interpretation':'PASS means Build 4 can truthfully read the existing Development acceptance authorities. HOLD is required while real browser/provider evidence is incomplete; configuration alone is never promoted to acceptance.',
  'release466_seo_source_fix_staged':True,
  'current_release465_live_seo_findings':['/cart/','/checkout/','/checkout/confirmation/','/supplies/health/','/tools/health/','/toolshed/duplicates/'],
  'native_github_ruleset':'external_repository_setting_pending',
  'safety':{
   'development_d1_operation':'SELECT only','production_business_rows_read':False,'production_mutation':False,
   'production_payment_execution':False,'production_provider_execution':False,'provider_publication':False,
   'automatic_payment_execution':False,'automatic_refund_execution':False,'automatic_oauth_action':False,
   'raw_r2_delete':False,'secrets_emitted':False,
  }
 }
 Path(args.output).write_text(json.dumps(evidence,indent=2,sort_keys=True)+'\n',encoding='utf-8');print(json.dumps(evidence,indent=2,sort_keys=True))
 if args.strict_external and not external_ok:
  raise SystemExit('Build 4 strict external acceptance is HOLD: real Development browser/provider evidence is incomplete')
 return 0

if __name__=='__main__':raise SystemExit(main())
