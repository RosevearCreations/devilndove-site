#!/usr/bin/env python3
"""Release 467 Build 296 progressive Custom Work source regression."""
from pathlib import Path
import re,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def q(ok,msg):
    if not ok:F.append(msg)
page=t('custom-request/index.html');client=t('public/js/custom-request-intake.js');api=t('functions/api/custom-request.js');css=t('css/custom-request-journey.css')
for phrase in ('What would you like made?','What matters most?','Anything we should know?','How can we reach you?'):
    q(phrase in page,f'progressive intake section missing: {phrase}')
q('id="customTechnicalDetails"' in page and '<details class="custom-intake-advanced"' in page,'optional technical disclosure missing')
q('id="customSuppliedItemDetails"' in page and 'name="supplied_item_condition_images"' in page,'customer-supplied-item conditional evidence path missing')
q('name="reference_images"' in page and 'name="attachment_urls"' in page,'optional reference media/link path missing')
required=set(re.findall(r'<(?:input|textarea|select)[^>]*name="([^"]+)"[^>]*\brequired\b',page,re.I))
q(required=={'message','name','email','consent_to_contact'},f'required-field set drifted: {sorted(required)}')
q('/public/js/custom-request-intake.js?v=467b216' in page,'Build 216 retained intake client route/version contract drifted')
for token in ('sessionStorage','dd_custom_request_draft_v296','custom_intake_started','custom_intake_draft_restored','custom_intake_advanced_opened','build296_progressive_intake','clearCustomRequestDraft'):
    q(token in client,f'Build 296 client contract missing: {token}')
q('localStorage' not in client,'Build 296 draft must remain tab-local rather than persistent localStorage')
q('type === \'file\'' in client and "name === 'consent_to_contact'" in client,'draft safety exclusions missing')
for token in ('manufacturing_route_proposed: false','automatic_quote_created: false','stock_reserved: false','provider_action_executed: false'):
    q(token in api,f'existing Custom Work safety boundary missing: {token}')
for ddl in ('CREATE TABLE','ALTER TABLE','DROP TABLE','CREATE INDEX'):
    q(ddl not in api.upper(),f'Custom Work API contains request-time DDL: {ddl}')
q('custom-intake-progress' in css and '@media(max-width:480px)' in css,'mobile progressive intake styles missing')
q(len(re.findall(r'<h1(?:\s|>)',page,re.I))==1,'Custom Work page must retain one H1')
print('RELEASE 467 BUILD 296 CUSTOM WORK PROGRESSIVE INTAKE REGRESSION')
if F:print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
print('Required fields: message / name / email / contact consent')
print('Technical detail: PROGRESSIVE / OPTIONAL')
print('Draft recovery: TAB-LOCAL / FILES EXCLUDED')
