from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
HELPER = ROOT / 'functions/api/_lib/paymentWebhookSecurity.js'
MIGRATION = ROOT / 'database_gift_card_runtime_parity.sql'

helper = HELPER.read_text(encoding='utf-8')
migration = MIGRATION.read_text(encoding='utf-8')

assert "'purchaser_user_id'" not in helper, 'webhook still requires legacy runtime-only purchaser_user_id'
assert 'purchaser_user_id' not in migration, 'Build 384 gift-card authority unexpectedly contains purchaser_user_id'
assert 'PRAGMA table_info(gift_cards)' in helper
assert 'gift_card_webhook_schema_not_ready' in helper
assert not re.search(r'\b(?:CREATE\s+TABLE|ALTER\s+TABLE|CREATE\s+(?:UNIQUE\s+)?INDEX|DROP\s+TABLE)\b', helper, re.I), 'webhook security helper contains runtime schema DDL'
for column in ('gift_card_id','code','currency','initial_amount_cents','remaining_amount_cents','recipient_email','recipient_name','recipient_note','purchaser_email','purchaser_name','order_id','purchase_source'):
    assert f"'{column}'" in helper, f'missing migration-owned webhook gift-card column: {column}'
print('RELEASE 461 PAYMENT WEBHOOK SCHEMA CONTRACT SOURCE GATE: PASS')
