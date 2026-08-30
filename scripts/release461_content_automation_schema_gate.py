from pathlib import Path
import re
import subprocess

ROOT = Path(__file__).resolve().parents[1]
automation = ROOT / 'functions/api/_lib/contentAutomationStudio.js'
publications = ROOT / 'functions/api/_lib/contentPublications.js'
readiness = ROOT / 'functions/api/_lib/contentAutomationSchemaReadiness.js'
migration = ROOT / 'migrations/dev/20260829_release461_content_automation_publication_authority.sql'
release_marker = ROOT / 'development-release.json'

DDL = re.compile(r'\b(?:CREATE\s+TABLE|ALTER\s+TABLE|CREATE\s+(?:UNIQUE\s+)?INDEX|DROP\s+TABLE|DROP\s+INDEX)\b', re.I)

for path in (automation, publications, readiness):
    text = path.read_text(encoding='utf-8')
    assert not DDL.search(text), f'content runtime DDL remains in {path}'

readiness_text = readiness.read_text(encoding='utf-8')
for token in (
    'PRAGMA table_info(', 'PRAGMA index_list(',
    'requireContentAutomationSchema', 'requireContentPublicationSchema',
    'content_projects', 'content_project_media', 'content_project_deliverables',
    'content_render_jobs', 'content_project_events', 'content_publications', 'content_publication_events',
):
    assert token in readiness_text, f'missing read-only content readiness token: {token}'

automation_text = automation.read_text(encoding='utf-8')
assert "from './contentAutomationSchemaReadiness.js'" in automation_text
assert 'return requireContentAutomationSchema(db);' in automation_text

publication_text = publications.read_text(encoding='utf-8')
assert "from './contentAutomationSchemaReadiness.js'" in publication_text
assert 'return requireContentPublicationSchema(db);' in publication_text
assert "from './contentAutomationStudio.js'" not in publication_text

migration_text = migration.read_text(encoding='utf-8')
assert not re.search(r'\bALTER\s+TABLE\b|\bDROP\s+TABLE\b|\bDROP\s+INDEX\b', migration_text, re.I)
for token in (
    'CREATE TABLE IF NOT EXISTS content_projects',
    'CREATE TABLE IF NOT EXISTS content_project_media',
    'CREATE TABLE IF NOT EXISTS content_project_deliverables',
    'CREATE TABLE IF NOT EXISTS content_render_jobs',
    'CREATE TABLE IF NOT EXISTS content_project_events',
    'CREATE TABLE IF NOT EXISTS content_publications',
    'CREATE TABLE IF NOT EXISTS content_publication_events',
    'idx_content_projects_source', 'idx_content_project_media_project', 'idx_content_deliverables_project',
    'idx_content_render_jobs_deliverable', 'idx_content_project_events_project',
    'idx_content_publications_project', 'idx_content_publications_public', 'idx_content_publication_events_publication',
    'PRAGMA foreign_key_check',
):
    assert token in migration_text, f'migration is missing content authority token: {token}'

release_text = release_marker.read_text(encoding='utf-8')
assert re.search(r'"release"\s*:\s*460\b', release_text), 'development-release.json must remain at accepted Release 460 until manual D1 acceptance'

for path in (automation, publications, readiness):
    subprocess.run(['node', '--check', str(path)], cwd=ROOT, check=True)

print('RELEASE 461 CONTENT AUTOMATION/PUBLICATION SCHEMA SOURCE GATE: PASS')
