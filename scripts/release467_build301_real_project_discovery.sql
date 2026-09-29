-- Release 467 Build 301 — read-only real project discovery.
-- No DDL, no mutation, no Production D1 contact.

-- 1: rank real active Creative Projects with no Maker Story profile.
SELECT
  p.creative_work_project_id,
  p.project_key,
  p.project_title,
  p.project_type,
  p.project_status,
  COALESCE(p.summary,'') summary,
  COALESCE(p.objective,'') objective,
  COALESCE(p.story_angle,'') story_angle,
  COUNT(e.creative_work_event_id) active_event_count,
  SUM(CASE WHEN TRIM(COALESCE(e.event_notes,''))<>'' THEN 1 ELSE 0 END) noted_event_count,
  SUM(CASE WHEN TRIM(COALESCE(e.event_title,''))<>'' THEN 1 ELSE 0 END) titled_event_count,
  (CASE WHEN TRIM(COALESCE(p.summary,''))<>'' THEN 1 ELSE 0 END
   + CASE WHEN TRIM(COALESCE(p.objective,''))<>'' THEN 1 ELSE 0 END
   + CASE WHEN TRIM(COALESCE(p.story_angle,''))<>'' THEN 1 ELSE 0 END) project_fact_fields
FROM creative_work_projects p
LEFT JOIN creative_project_maker_story_profiles msp
  ON msp.creative_work_project_id=p.creative_work_project_id
LEFT JOIN creative_work_events e
  ON e.creative_work_project_id=p.creative_work_project_id
 AND COALESCE(e.entry_status,'active')='active'
WHERE p.project_status<>'archived'
  AND msp.creative_work_project_id IS NULL
GROUP BY p.creative_work_project_id
ORDER BY project_fact_fields DESC, noted_event_count DESC, active_event_count DESC, p.creative_work_project_id
LIMIT 10;

-- 2: full timeline for the highest-ranked eligible project.
WITH ranked AS (
  SELECT
    p.creative_work_project_id,
    (CASE WHEN TRIM(COALESCE(p.summary,''))<>'' THEN 1 ELSE 0 END
     + CASE WHEN TRIM(COALESCE(p.objective,''))<>'' THEN 1 ELSE 0 END
     + CASE WHEN TRIM(COALESCE(p.story_angle,''))<>'' THEN 1 ELSE 0 END) fact_score,
    (SELECT COUNT(*) FROM creative_work_events e
      WHERE e.creative_work_project_id=p.creative_work_project_id
        AND COALESCE(e.entry_status,'active')='active'
        AND TRIM(COALESCE(e.event_notes,''))<>'') noted_events,
    (SELECT COUNT(*) FROM creative_work_events e
      WHERE e.creative_work_project_id=p.creative_work_project_id
        AND COALESCE(e.entry_status,'active')='active') event_count
  FROM creative_work_projects p
  LEFT JOIN creative_project_maker_story_profiles msp
    ON msp.creative_work_project_id=p.creative_work_project_id
  WHERE p.project_status<>'archived' AND msp.creative_work_project_id IS NULL
  ORDER BY fact_score DESC,noted_events DESC,event_count DESC,p.creative_work_project_id
  LIMIT 1
)
SELECT
  e.creative_work_project_id,
  e.creative_work_event_id,
  e.event_type,
  e.event_title,
  COALESCE(e.event_notes,'') event_notes,
  COALESCE(e.material_name,'') material_name,
  COALESCE(e.material_quantity,0) material_quantity,
  COALESCE(e.material_unit,'') material_unit,
  COALESCE(e.is_public_candidate,0) is_public_candidate,
  e.occurred_at
FROM creative_work_events e
WHERE e.creative_work_project_id=(SELECT creative_work_project_id FROM ranked)
  AND COALESCE(e.entry_status,'active')='active'
ORDER BY e.occurred_at,e.creative_work_event_id
LIMIT 60;

-- 3: existing linked authority for the same candidate.
WITH ranked AS (
  SELECT p.creative_work_project_id,
    (CASE WHEN TRIM(COALESCE(p.summary,''))<>'' THEN 1 ELSE 0 END
     + CASE WHEN TRIM(COALESCE(p.objective,''))<>'' THEN 1 ELSE 0 END
     + CASE WHEN TRIM(COALESCE(p.story_angle,''))<>'' THEN 1 ELSE 0 END) fact_score,
    (SELECT COUNT(*) FROM creative_work_events e WHERE e.creative_work_project_id=p.creative_work_project_id AND COALESCE(e.entry_status,'active')='active' AND TRIM(COALESCE(e.event_notes,''))<>'') noted_events,
    (SELECT COUNT(*) FROM creative_work_events e WHERE e.creative_work_project_id=p.creative_work_project_id AND COALESCE(e.entry_status,'active')='active') event_count
  FROM creative_work_projects p
  LEFT JOIN creative_project_maker_story_profiles msp ON msp.creative_work_project_id=p.creative_work_project_id
  WHERE p.project_status<>'archived' AND msp.creative_work_project_id IS NULL
  ORDER BY fact_score DESC,noted_events DESC,event_count DESC,p.creative_work_project_id
  LIMIT 1
)
SELECT
  r.creative_work_project_id,
  (SELECT COUNT(*) FROM creative_projects cp WHERE cp.source_type='creative_work_project' AND cp.source_id=CAST(r.creative_work_project_id AS TEXT)) caip_workspace_count,
  (SELECT COUNT(*) FROM content_projects cp WHERE cp.source_type='creative_project' AND cp.source_id=CAST(r.creative_work_project_id AS TEXT)) content_package_count,
  (SELECT COUNT(*) FROM creative_project_evidence_selections s WHERE s.creative_work_project_id=r.creative_work_project_id AND s.selected=1) selected_evidence_count,
  (SELECT COUNT(*) FROM creative_project_maker_story_workstations w WHERE w.creative_work_project_id=r.creative_work_project_id) existing_story_workstation_count
FROM ranked r;
