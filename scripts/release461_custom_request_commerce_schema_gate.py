from pathlib import Path
import re
ROOT=Path(__file__).resolve().parents[1]
ROUTES=[ROOT/'functions/api/custom-request-order.js',ROOT/'functions/api/custom-request-quote.js',ROOT/'functions/api/custom-request-payment.js']
HELPER=ROOT/'functions/api/_lib/customRequestCommerceSchemaReadiness.js'; MIG=ROOT/'migrations/dev/20260829_release461_custom_request_commerce_authority.sql'
DDL=re.compile(r'\b(?:CREATE\s+TABLE|ALTER\s+TABLE|CREATE\s+(?:UNIQUE\s+)?INDEX|DROP\s+TABLE)\b',re.I)
for p in ROUTES+[HELPER]: assert not DDL.search(p.read_text(encoding='utf-8')),f'runtime DDL remains in {p}'
combined='\n'.join(p.read_text(encoding='utf-8') for p in ROUTES)
for token in ('custom_request_order_schema_unavailable','custom_request_quote_schema_unavailable','custom_request_payment_schema_unavailable','hasCustomRequestOrderSchema','hasCustomRequestQuoteSchema','hasCustomRequestPaymentSchema'): assert token in combined
m=MIG.read_text(encoding='utf-8'); assert not re.search(r'\bALTER\s+TABLE\b|\bDROP\s+TABLE\b',m,re.I); assert not re.search(r'CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+custom_request_quote_drafts',m,re.I)
for t in ('custom_request_order_status_links','custom_request_quote_share_links','custom_request_quote_line_items','custom_request_quote_revisions','custom_request_payment_request_drafts','custom_request_order_drafts','custom_request_payment_links','custom_request_payment_checkout_records','idx_custom_checkout_records_request','PRAGMA foreign_key_check'): assert t in m
payment=ROUTES[2].read_text(encoding='utf-8'); assert 'prepareCheckoutPayment' in payment
print('RELEASE 461 CUSTOM REQUEST COMMERCE SCHEMA SOURCE GATE: PASS')
