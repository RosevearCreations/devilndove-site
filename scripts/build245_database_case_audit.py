from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
FILES = ['database_schema.sql','database_full_schema.sql','database_store_schema.sql','database_build243_inventory_resilience_case_normalization.sql','database_build244_inventory_authority_fractional_usage.sql','database_build245_admin_media_resilience.sql','database_upgrade_current_pass.sql']
errors=[]
objects=0
pattern=re.compile(r'(?im)^\s*CREATE\s+(?:UNIQUE\s+)?(?:TABLE|INDEX|VIEW|TRIGGER)\s+(?:IF\s+NOT\s+EXISTS\s+)?["`\[]?([A-Za-z0-9_]+)')
for fn in FILES:
    data=(ROOT/fn).read_text(encoding='utf-8')
    for m in pattern.finditer(data):
        objects += 1
        name=m.group(1)
        if name != name.lower(): errors.append(f'{fn}: mixed-case database object identifier {name}')

# The policy is deliberately scoped to controlled classifications, not customer/product display names or external IDs.
mig=(ROOT/'database_build243_inventory_resilience_case_normalization.sql').read_text(encoding='utf-8')
for target in ['product_category','color_name','shipping_code','item_kind','category','subcategory','item_type','source_type','stock_unit_label','usage_unit_label','reuse_status','resource_kind']:
    if target not in mig: errors.append(f'Migration does not cover controlled classification field {target}')

options=(ROOT/'functions/api/admin/_catalog-options.js').read_text(encoding='utf-8')
# Check quoted default option values in known arrays; display prose elsewhere is intentionally not forced lowercase.
for array_name in ['DEFAULT_CATEGORY_OPTIONS','DEFAULT_COLOR_OPTIONS','DEFAULT_SHIPPING_CODE_OPTIONS']:
    m=re.search(rf'const\s+{array_name}\s*=\s*\[(.*?)\];', options, re.S)
    if not m:
        errors.append(f'Could not locate {array_name}')
        continue
    for value in re.findall(r"['\"]([^'\"]+)['\"]", m.group(1)):
        if value != value.lower(): errors.append(f'{array_name}: default option is not lowercase: {value}')

if errors:
    print('Build 245 database case audit: FAIL')
    for e in errors: print('-',e)
    raise SystemExit(1)
print('Build 245 database case audit: PASS')
print(f'Database object identifiers checked: {objects}; mixed-case identifiers: 0')
print('Controlled classification defaults: lowercase')
print('Display names, URLs, ASINs/SKUs, order numbers and currencies: intentionally case-preserving')
