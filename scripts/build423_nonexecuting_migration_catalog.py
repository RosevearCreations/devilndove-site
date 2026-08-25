#!/usr/bin/env python3
"""Build 423 non-executing Production parity migration catalog.

This module is data only. It contains reviewed migration-family intent for local
fixtures and release gates. It is NOT an executable Production migration helper.
"""

PRODUCT_NUMBER = {
    'start': 1000,
    'never_reuse': True,
    'source': 'functions/api/admin/_product-numbering.js',
    'backfill_requires_exact_product_identity': True,
    'production_write_enabled': False,
}

GIFT_CARD = {
    'authority': 'database_gift_card_runtime_parity.sql',
    'lookup_attempt_columns': ['lookup_email', 'code_suffix', 'ip_hash', 'user_agent', 'result_status'],
    'lookup_attempt_indexes': [
        'idx_gift_card_lookup_attempts_created',
        'idx_gift_card_lookup_attempts_email',
    ],
    'lockout_table': 'gift_card_lookup_lockouts',
    'lockout_index': 'idx_gift_card_lookup_lockouts_status',
    'plan': 'additive',
}

NOTIFICATION = {
    'authority': 'database_notification_runtime_parity.sql',
    'columns': ['metadata_json'],
    'indexes': [
        'idx_notification_outbox_kind_destination',
        'idx_notification_outbox_order',
        'idx_notification_outbox_payment',
        'idx_notification_outbox_product',
    ],
    'plan': 'additive',
}

PRODUCT_IMAGE_ANNOTATIONS = {
    'authority': 'database_build197_application_resilience_media_catalog.sql',
    'index': 'idx_product_image_annotations_product_image_build197',
    'columns': ['product_id', 'product_image_id'],
    'plan': 'additive-index',
}

MEMBERSHIP = {
    'authority': 'database_membership_tier_policy_runtime_parity.sql',
    'canonical_columns': [
        'policy_id', 'tier_code', 'title', 'short_description', 'benefits_json',
        'badge_color', 'sort_order', 'is_visible', 'created_at', 'updated_at',
    ],
    'legacy_aliases': {
        'membership_tier_policy_id': 'policy_id',
        'code': 'tier_code',
        'name': 'title',
        'display_title': 'title',
    },
    'plan': 'data-preserving-rebuild',
}

FRACTIONAL_TABLES = {
    'site_item_inventory': ['on_hand_quantity', 'reserved_quantity', 'incoming_quantity', 'reorder_level', 'preferred_reorder_quantity'],
    'site_inventory_movements': ['previous_on_hand_quantity', 'new_on_hand_quantity', 'previous_reserved_quantity', 'new_reserved_quantity', 'previous_incoming_quantity', 'new_incoming_quantity', 'quantity_delta'],
    'creative_project_inventory_posts': ['stock_quantity_consumed', 'previous_on_hand_quantity', 'new_on_hand_quantity'],
    'creative_project_inventory_reversals': ['stock_quantity_restored', 'previous_on_hand_quantity', 'new_on_hand_quantity'],
    'product_material_return_audit': ['previous_on_hand_quantity', 'new_on_hand_quantity', 'previous_reserved_quantity', 'new_reserved_quantity'],
}

PRODUCT_FK_FAMILY = {
    'product_media_score_history': [('product_id', 'products', 'product_id'), ('actor_user_id', 'users', 'user_id')],
    'product_review_actions': [('actor_user_id', 'users', 'user_id')],
    'products': [('capture_created_by_user_id', 'users', 'user_id'), ('capture_updated_by_user_id', 'users', 'user_id')],
    'site_page_views': [('site_visitor_session_id', 'site_visitor_sessions', 'site_visitor_session_id')],
    'supplier_purchase_order_items': [('site_item_inventory_id', 'site_item_inventory', 'site_item_inventory_id')],
}

ACCOUNTING_FAMILY = ['accounting_expenses', 'accounting_writeoffs', 'general_ledger_accounts']
CONSTRAINT_DEFAULT_FAMILY = ['product_costs', 'movie_catalog', 'product_resource_links', 'tax_classes']

ONE_SIDED = {
    'search_query_terms': 'preserve-5-live-rows-pending-authority',
    '__sql_test': 'leave-empty-production-residue-untouched-pending-retirement-proof',
    'gift_card_lookup_lockouts': 'required-current-schema-additive-production-candidate',
}

SAFETY = {
    'production_schema_mutation': False,
    'executable_production_helper': False,
    'broad_prod_to_dev_copy': False,
    'caip_d1_only_copy': False,
    'provider_mutation': False,
    'production_promotion': False,
}
