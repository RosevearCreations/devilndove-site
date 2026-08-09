from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
api = (ROOT / 'functions/api/admin/site-item-inventory.js').read_text(encoding='utf-8')
ui = (ROOT / 'public/js/admin-site-item-inventory.js').read_text(encoding='utf-8')
errors = []

needle = 'INSERT INTO site_item_inventory ('
post_anchor = api.find('async function handlePost')
if post_anchor == -1:
    post_anchor = api.find('export async function onRequestPost')
start = api.find(needle, post_anchor)
if start == -1:
    errors.append('Could not locate manual site_item_inventory INSERT.')
else:
    values_start = api.find('VALUES (', start)
    values_end = api.find(')\n    `).bind(', values_start)
    if values_start == -1 or values_end == -1:
        errors.append('Could not isolate manual inventory VALUES block.')
    else:
        values_block = api[values_start:values_end]
        placeholder_count = values_block.count('?')
        if placeholder_count != 27:
            errors.append(f'Manual inventory INSERT expected 27 placeholders, found {placeholder_count}.')

markers = [
    (api, "incident_code: 'inventory_create_failed'"),
    (api, "code: 'inventory_create_failed'"),
    (ui, 'async function readApiPayload'),
    (ui, 'async function readApiPayload'),
    (ui, 'window.DDAuth.readApiJson'),
]
for haystack, marker in markers:
    if marker not in haystack:
        errors.append(f'Missing Build 242 resilience marker: {marker}')

if errors:
    print('Build 242 inventory create regression: FAIL')
    for error in errors:
        print('-', error)
    raise SystemExit(1)

print('Build 242 inventory create regression: PASS')
print('Manual inventory INSERT placeholders: 27')
print('JSON/HTML response boundary: present')
print('Runtime incident capture: present')
