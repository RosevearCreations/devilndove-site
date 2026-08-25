#!/usr/bin/env python3
"""Source-only Build 422 release fixture catalog.

This module is data only. It describes required migration families and assertions;
it does not connect to Cloudflare or execute SQL against Production.
"""
from __future__ import annotations

GIFT_CARD_LOOKUP_COLUMNS = (
    'lookup_email',
    'code_suffix',
    'ip_hash',
    'user_agent',
    'result_status',
)

GIFT_CARD_LOOKUP_INDEXES = (
    'idx_gift_card_lookup_attempts_created',
    'idx_gift_card_lookup_attempts_email',
    'idx_gift_card_lookup_lockouts_status',
)

NOTIFICATION_OUTBOX_INDEXES = (
    'idx_notification_outbox_status_due',
    'idx_notification_outbox_kind_destination',
    'idx_notification_outbox_order',
    'idx_notification_outbox_payment',
    'idx_notification_outbox_product',
)

MEMBERSHIP_CANONICAL_COLUMNS = (
    'policy_id',
    'tier_code',
    'title',
    'short_description',
    'benefits_json',
    'badge_color',
    'sort_order',
    'is_visible',
    'created_at',
    'updated_at',
)

MEMBERSHIP_LEGACY_ALIASES = {
    'membership_tier_policy_id': 'policy_id',
    'code': 'tier_code',
    'name': 'title',
    'display_title': 'title',
}

FRACTIONAL_TABLE_COLUMNS = {
    'site_item_inventory': (
        'on_hand_quantity',
        'reserved_quantity',
        'incoming_quantity',
        'reorder_level',
        'preferred_reorder_quantity',
    ),
    'site_inventory_movements': (
        'previous_on_hand_quantity',
        'new_on_hand_quantity',
        'previous_reserved_quantity',
        'new_reserved_quantity',
        'previous_incoming_quantity',
        'new_incoming_quantity',
        'quantity_delta',
    ),
    'creative_project_inventory_posts': (
        'stock_quantity_consumed',
        'previous_on_hand_quantity',
        'new_on_hand_quantity',
    ),
    'creative_project_inventory_reversals': (
        'stock_quantity_restored',
        'previous_on_hand_quantity',
        'new_on_hand_quantity',
    ),
    'product_material_return_audit': (
        'previous_on_hand_quantity',
        'new_on_hand_quantity',
        'previous_reserved_quantity',
        'new_reserved_quantity',
    ),
}

PRODUCT_FK_FAMILIES = {
    'product_media_score_history': (
        ('product_id', 'products', 'product_id'),
        ('actor_user_id', 'users', 'user_id'),
    ),
    'product_review_actions': (
        ('actor_user_id', 'users', 'user_id'),
    ),
    'products': (
        ('capture_created_by_user_id', 'users', 'user_id'),
        ('capture_updated_by_user_id', 'users', 'user_id'),
    ),
    'site_page_views': (
        ('site_visitor_session_id', 'site_visitor_sessions', 'site_visitor_session_id'),
    ),
    'supplier_purchase_order_items': (
        ('site_item_inventory_id', 'site_item_inventory', 'site_item_inventory_id'),
    ),
}

ACCOUNTING_REBUILD_TABLES = (
    'accounting_expenses',
    'accounting_writeoffs',
    'general_ledger_accounts',
)

CONSTRAINT_REVIEW_TABLES = (
    'product_costs',
    'movie_catalog',
    'product_resource_links',
    'tax_classes',
)

ROLLOUT_PHASES = (
    'backup_and_export_evidence',
    'read_only_prechecks',
    'gift_card_additive',
    'notification_additive',
    'approved_additive_indexes',
    'membership_data_preserving_rebuild',
    'fractional_inventory_rebuilds',
    'product_fk_rebuilds',
    'accounting_constraint_rebuilds',
    'foreign_key_and_schema_verification',
    'business_anchor_recount',
    'browser_read_contract_proof',
    'promotion_decision',
)

PRODUCTION_MUTATION_ENABLED = False
EXECUTABLE_PRODUCTION_HELPER_ALLOWED = False
BROAD_PRODUCTION_TO_DEVELOPMENT_COPY_ALLOWED = False
CAIP_D1_ONLY_COPY_ALLOWED = False
