from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
HELPER = ROOT / 'functions/api/_lib/productOffers.js'
MIGRATION = ROOT / 'migrations/dev/20260829_release461_public_product_offer_authority.sql'

helper = HELPER.read_text(encoding='utf-8')
migration = MIGRATION.read_text(encoding='utf-8')

ddl = re.compile(r'\b(?:CREATE\s+TABLE|ALTER\s+TABLE|CREATE\s+(?:UNIQUE\s+)?INDEX|DROP\s+TABLE)\b', re.I)
assert not ddl.search(helper), 'productOffers runtime helper still contains schema DDL'
for token in ('hasProductOffersSchema','PRAGMA table_info(${tableName})','product_offer_schema_unavailable','product_quantity_price_tiers','product_bundle_settings','product_bundle_components'):
    assert token in helper, f'missing read-only product-offer authority token: {token}'
assert not re.search(r'\bALTER\s+TABLE\b|\bDROP\s+TABLE\b', migration, re.I)
for token in ('CREATE TABLE IF NOT EXISTS product_quantity_price_tiers','CREATE TABLE IF NOT EXISTS product_bundle_settings','CREATE TABLE IF NOT EXISTS product_bundle_components','idx_product_quantity_price_tiers_product','idx_product_bundle_components_bundle','idx_product_bundle_components_component','PRAGMA foreign_key_check'):
    assert token in migration, f'missing product-offer migration token: {token}'
print('RELEASE 461 PRODUCT OFFER SCHEMA SOURCE GATE: PASS')
