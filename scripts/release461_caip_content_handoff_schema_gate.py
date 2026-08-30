#!/usr/bin/env python3
"""Release 461 CAIP handoff schema/query contract gate.

Source-only proof. This gate never contacts or mutates D1, R2, providers, Pages,
or the separate live Production application.
"""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ROUTE_PATH = ROOT / "functions/api/admin/caip-content-handoff.js"
SCHEMA_PATH = ROOT / "database_full_schema.sql"

route = ROUTE_PATH.read_text(encoding="utf-8")
schema = SCHEMA_PATH.read_text(encoding="utf-8", errors="replace")

match = re.search(
    r"CREATE TABLE IF NOT EXISTS\s+creative_media_evidence_ranges\s*\((.*?)\n\);",
    schema,
    re.IGNORECASE | re.DOTALL,
)
if not match:
    raise SystemExit("FAIL — canonical creative_media_evidence_ranges definition is missing from database_full_schema.sql")

table = match.group(1)
required_schema_columns = (
    "creative_media_evidence_range_id",
    "creative_project_id",
    "creative_asset_id",
    "marker_key",
    "evidence_category",
    "title",
    "note_text",
    "transcript_excerpt",
    "start_seconds",
    "end_seconds",
    "visibility",
    "confidence_score",
    "linked_story_evidence_id",
    "marker_status",
    "review_status",
)
for column in required_schema_columns:
    if not re.search(rf"\b{re.escape(column)}\b", table):
        raise SystemExit(f"FAIL — canonical creative_media_evidence_ranges is missing {column}")

if re.search(r"\bconfidence_percent\b", table):
    raise SystemExit("FAIL — confidence_percent must not be invented as a D1 column; canonical authority is confidence_score")

required_route_markers = (
    "const REQUIRED_COLUMNS",
    "creative_media_evidence_ranges:",
    "'confidence_score'",
    "PRAGMA table_info",
    "missing_columns",
    "r.confidence_score AS confidence_percent",
)
for marker in required_route_markers:
    if marker not in route:
        raise SystemExit(f"FAIL — CAIP handoff route is missing Release 461 schema guard: {marker}")

if "r.confidence_percent" in route:
    raise SystemExit("FAIL — CAIP handoff route still queries non-canonical r.confidence_percent")

forbidden_runtime_ddl = re.compile(r"\b(?:CREATE|ALTER|DROP)\s+(?:TABLE|INDEX)\b", re.IGNORECASE)
if forbidden_runtime_ddl.search(route):
    raise SystemExit("FAIL — CAIP handoff route contains request-time schema DDL")

if "if(!data.readiness.schema_ready)return json" not in route:
    raise SystemExit("FAIL — CAIP handoff GET/POST must fail closed on schema mismatch")

print("RELEASE 461 CAIP CONTENT HANDOFF SCHEMA CONTRACT: PASS")
print("Canonical confidence authority: creative_media_evidence_ranges.confidence_score")
print("API compatibility projection: confidence_percent alias preserved")
print("Column-level runtime readiness: READ ONLY / FAIL CLOSED")
print("D1 mutation: NONE")
print("R2/provider/Production mutation: NONE")
