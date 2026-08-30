const CONTENT_AUTOMATION_SCHEMA = {
  content_projects: {
    columns: [
      'content_project_id', 'content_project_key', 'source_type', 'source_id', 'product_id', 'project_title', 'project_status',
      'review_status', 'public_release_status', 'story_angle', 'factual_summary', 'internal_notes', 'source_snapshot_json',
      'content_policy_json', 'created_by_user_id', 'approved_by_user_id', 'approved_at', 'created_at', 'updated_at'
    ],
    indexes: ['idx_content_projects_source'],
  },
  content_project_media: {
    columns: [
      'content_project_media_id', 'content_project_id', 'media_asset_id', 'product_image_id', 'archive_key', 'archive_path', 'source_url',
      'media_type', 'original_filename', 'mime_type', 'sort_order', 'selection_score', 'selection_reason', 'safety_status',
      'consent_record_id', 'is_selected', 'is_featured', 'source_metadata_json', 'created_at', 'updated_at'
    ],
    indexes: ['idx_content_project_media_project'],
  },
  content_project_deliverables: {
    columns: [
      'content_project_deliverable_id', 'content_project_id', 'deliverable_key', 'channel_key', 'deliverable_type', 'title', 'caption',
      'script_text', 'body_content', 'asset_plan_json', 'aspect_ratio', 'target_duration_seconds', 'output_url', 'thumbnail_url',
      'deliverable_status', 'approval_status', 'review_notes', 'approved_by_user_id', 'approved_at', 'published_at',
      'social_post_queue_id', 'copy_locked', 'generated_by', 'created_at', 'updated_at'
    ],
    indexes: ['idx_content_deliverables_project'],
  },
  content_render_jobs: {
    columns: [
      'content_render_job_id', 'content_project_deliverable_id', 'render_provider', 'render_status', 'render_payload_json',
      'output_url', 'error_text', 'requested_by_user_id', 'completed_at', 'created_at', 'updated_at'
    ],
    indexes: ['idx_content_render_jobs_deliverable'],
  },
  content_project_events: {
    columns: ['content_project_event_id', 'content_project_id', 'event_type', 'actor_user_id', 'details_json', 'created_at'],
    indexes: ['idx_content_project_events_project'],
  },
};

const CONTENT_PUBLICATION_SCHEMA = {
  content_publications: {
    columns: [
      'content_publication_id', 'publication_key', 'content_project_id', 'content_project_deliverable_id', 'destination',
      'publication_slug', 'title', 'summary', 'body_content', 'hero_media_url', 'hero_alt_text', 'media_urls_json', 'product_path',
      'canonical_path', 'meta_title', 'meta_description', 'schema_json', 'content_status', 'review_notes', 'copy_locked',
      'metrics_json', 'approved_by_user_id', 'approved_at', 'published_by_user_id', 'published_at', 'unpublished_at',
      'created_at', 'updated_at'
    ],
    indexes: ['idx_content_publications_project', 'idx_content_publications_public'],
  },
  content_publication_events: {
    columns: ['content_publication_event_id', 'content_publication_id', 'event_type', 'actor_user_id', 'details_json', 'created_at'],
    indexes: ['idx_content_publication_events_publication'],
  },
};

function resultRows(result) {
  return Array.isArray(result?.results) ? result.results : [];
}

async function tableColumns(db, tableName) {
  try {
    const result = await db.prepare(`PRAGMA table_info(${tableName})`).all();
    return new Set(resultRows(result).map((row) => String(row?.name || '').trim()).filter(Boolean));
  } catch {
    return new Set();
  }
}

async function tableIndexes(db, tableName) {
  try {
    const result = await db.prepare(`PRAGMA index_list(${tableName})`).all();
    return new Set(resultRows(result).map((row) => String(row?.name || '').trim()).filter(Boolean));
  } catch {
    return new Set();
  }
}

async function requireSchemaMap(db, schemaMap, authorityLabel) {
  for (const [tableName, requirement] of Object.entries(schemaMap)) {
    const columns = await tableColumns(db, tableName);
    const missingColumns = requirement.columns.filter((column) => !columns.has(column));
    if (missingColumns.length) {
      throw new Error(`${authorityLabel} schema is not ready: ${tableName} is missing ${missingColumns.join(', ')}. Apply the current Development migration authority.`);
    }

    const indexes = await tableIndexes(db, tableName);
    const missingIndexes = requirement.indexes.filter((indexName) => !indexes.has(indexName));
    if (missingIndexes.length) {
      throw new Error(`${authorityLabel} schema is not ready: ${tableName} is missing index ${missingIndexes.join(', ')}. Apply the current Development migration authority.`);
    }
  }
  return true;
}

export async function requireContentAutomationSchema(db) {
  return requireSchemaMap(db, CONTENT_AUTOMATION_SCHEMA, 'Content Automation Studio');
}

export async function requireContentPublicationSchema(db) {
  await requireContentAutomationSchema(db);
  return requireSchemaMap(db, CONTENT_PUBLICATION_SCHEMA, 'Content publication');
}
