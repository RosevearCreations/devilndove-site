from pathlib import Path
import re
ROOT=Path(__file__).resolve().parents[1]; route=ROOT/'functions/api/auth/account-help-request.js'; helper=ROOT/'functions/api/_lib/publicNotificationQueue.js'
DDL=re.compile(r'\b(?:CREATE\s+TABLE|ALTER\s+TABLE|CREATE\s+(?:UNIQUE\s+)?INDEX|DROP\s+TABLE)\b',re.I)
for p in (route,helper): assert not DDL.search(p.read_text(encoding='utf-8')),f'public auth schema DDL remains in {p}'
r=route.read_text(encoding='utf-8'); assert 'notificationOutbox.js' not in r and 'processNotificationOutbox' not in r and 'queuePublicNotification' in r
h=helper.read_text(encoding='utf-8'); assert 'PRAGMA table_info(notification_outbox)' in h and 'notification_outbox_schema_unavailable' in h
print('RELEASE 461 PUBLIC AUTH SCHEMA SOURCE GATE: PASS')
