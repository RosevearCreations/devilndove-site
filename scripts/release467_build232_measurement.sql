WITH
product_base AS (
  SELECT *
  FROM products
  WHERE LOWER(TRIM(COALESCE(status,'draft'))) NOT IN ('archived','deleted')
  ORDER BY updated_at DESC,product_id DESC
  LIMIT 240
),
role_by_image AS (
  SELECT pia.product_image_id,
         MAX(CASE WHEN TRIM(COALESCE(pia.image_role,''))<>'' THEN 1 ELSE 0 END) has_role
  FROM product_image_annotations pia
  JOIN product_images pi0 ON pi0.product_image_id=pia.product_image_id
  JOIN product_base pb0 ON pb0.product_id=pi0.product_id
  GROUP BY pia.product_image_id
),
image_stats AS (
  SELECT pi.product_id,
         COUNT(*) image_count,
         SUM(CASE WHEN LENGTH(TRIM(COALESCE(pi.alt_text,'')))<12 THEN 1 ELSE 0 END) alt_attention,
         SUM(CASE WHEN COALESCE(rbi.has_role,0)=0 THEN 1 ELSE 0 END) role_attention,
         SUM(CASE WHEN TRIM(COALESCE(pi.image_url,''))<>'' AND LOWER(TRIM(pi.image_url)) NOT LIKE 'https://assets.devilndove.com/%' THEN 1 ELSE 0 END) image_source_attention
  FROM product_images pi
  JOIN product_base pb ON pb.product_id=pi.product_id
  LEFT JOIN role_by_image rbi ON rbi.product_image_id=pi.product_image_id
  GROUP BY pi.product_id
),
featured_match AS (
  SELECT pb.product_id,
         CASE WHEN TRIM(COALESCE(pb.featured_image_url,''))<>'' AND
           SUM(CASE WHEN TRIM(COALESCE(pi.image_url,''))=TRIM(COALESCE(pb.featured_image_url,'')) THEN 1 ELSE 0 END)=0
         THEN 1 ELSE 0 END featured_not_in_gallery
  FROM product_base pb
  LEFT JOIN product_images pi ON pi.product_id=pb.product_id
  GROUP BY pb.product_id,pb.featured_image_url
),
inventory_ranked AS (
  SELECT site_item_inventory_id,
         LOWER(TRIM(COALESCE(source_type,''))) item_kind_norm,
         LOWER(TRIM(COALESCE(external_key,''))) source_key_norm,
         COALESCE(is_active,1) is_active,
         COALESCE(unit_cost_cents,0) unit_cost_cents,
         ROW_NUMBER() OVER (
           PARTITION BY LOWER(TRIM(COALESCE(source_type,''))),LOWER(TRIM(COALESCE(external_key,'')))
           ORDER BY COALESCE(is_active,1) DESC,site_item_inventory_id DESC
         ) rn
  FROM site_item_inventory
  WHERE LOWER(TRIM(COALESCE(source_type,''))) IN ('tool','supply')
),
resource_facts AS (
  SELECT prl.product_id,
         ir.site_item_inventory_id,
         COALESCE(ir.is_active,0) inventory_active,
         COALESCE(ir.unit_cost_cents,0) unit_cost_cents,
         CASE WHEN COALESCE(prl.consumption_mode,'per_unit')='story_only'
           OR (LOWER(TRIM(COALESCE(prl.resource_kind,'')))='tool'
               AND LOWER(TRIM(COALESCE(siup.usage_tracking_mode,'reusable'))) IN ('reusable','log_only'))
           THEN 0 ELSE 1 END cost_required
  FROM product_resource_links prl
  JOIN product_base pb ON pb.product_id=prl.product_id
  LEFT JOIN inventory_ranked ir
    ON ir.rn=1
   AND ir.item_kind_norm=LOWER(TRIM(COALESCE(prl.resource_kind,'')))
   AND ir.source_key_norm=LOWER(TRIM(COALESCE(prl.source_key,'')))
  LEFT JOIN site_inventory_usage_profiles siup ON siup.site_item_inventory_id=ir.site_item_inventory_id
),
resource_stats AS (
  SELECT product_id,
         COUNT(*) linked_resource_count,
         SUM(CASE WHEN site_item_inventory_id IS NULL THEN 1 ELSE 0 END) missing_inventory_matches,
         SUM(CASE WHEN site_item_inventory_id IS NOT NULL AND inventory_active<>1 THEN 1 ELSE 0 END) inactive_inventory_links,
         SUM(CASE WHEN cost_required=1 AND (site_item_inventory_id IS NULL OR unit_cost_cents<=0) THEN 1 ELSE 0 END) unknown_cost_links
  FROM resource_facts
  GROUP BY product_id
),
product_evidence AS (
  SELECT pb.*,
         COALESCE(img.image_count,0) image_count,
         COALESCE(img.alt_attention,0) alt_attention,
         COALESCE(img.role_attention,0) role_attention,
         COALESCE(img.image_source_attention,0) image_source_attention,
         COALESCE(fm.featured_not_in_gallery,0) featured_not_in_gallery,
         COALESCE(rs.linked_resource_count,0) linked_resource_count,
         COALESCE(rs.missing_inventory_matches,0) missing_inventory_matches,
         COALESCE(rs.inactive_inventory_links,0) inactive_inventory_links,
         COALESCE(rs.unknown_cost_links,0) unknown_cost_links,
         CASE WHEN
           TRIM(COALESCE(pb.name,''))='' OR TRIM(COALESCE(pb.slug,''))='' OR TRIM(COALESCE(pb.product_category,''))=''
           OR LOWER(TRIM(COALESCE(pb.product_type,'physical'))) NOT IN ('physical','digital')
           OR COALESCE(pb.price_cents,0)<=0 OR TRIM(COALESCE(pb.currency,''))=''
           OR (LOWER(TRIM(COALESCE(pb.product_type,'physical')))='physical' AND COALESCE(pb.requires_shipping,0)=1 AND COALESCE(pb.weight_grams,0)<=0)
           OR (LOWER(TRIM(COALESCE(pb.product_type,'physical')))='physical' AND COALESCE(pb.requires_shipping,0)=1 AND TRIM(COALESCE(pb.shipping_code,''))='')
           OR (LOWER(TRIM(COALESCE(pb.product_type,'physical')))='digital' AND TRIM(COALESCE(pb.digital_file_url,''))='')
           OR (LOWER(TRIM(COALESCE(pb.sale_channel,'onsite'))) IN ('hybrid','external_only') AND TRIM(COALESCE(pb.external_listing_url,''))='')
           OR (LOWER(TRIM(COALESCE(pb.status,'draft')))='active' AND LOWER(TRIM(COALESCE(pb.review_status,'pending_review'))) NOT IN ('approved','published'))
         THEN 1 ELSE 0 END buyer_blocked,
         CASE WHEN LOWER(TRIM(COALESCE(pb.status,'draft')))='active'
           AND LOWER(TRIM(COALESCE(pb.review_status,''))) IN ('','approved','published')
           AND TRIM(COALESCE(pb.slug,''))<>'' THEN 1 ELSE 0 END publicly_visible,
         CASE WHEN UPPER(TRIM(COALESCE(pb.currency,''))) NOT IN ('','CAD')
           OR LOWER(TRIM(COALESCE(pb.sale_channel,'onsite')))='external_only'
         THEN 1 ELSE 0 END externally_blocked
  FROM product_base pb
  LEFT JOIN image_stats img ON img.product_id=pb.product_id
  LEFT JOIN featured_match fm ON fm.product_id=pb.product_id
  LEFT JOIN resource_stats rs ON rs.product_id=pb.product_id
),
classified_products AS (
  SELECT *,
         CASE WHEN TRIM(COALESCE(featured_image_url,''))<>'' AND image_count>=3
           AND alt_attention=0 AND role_attention=0 AND image_source_attention=0 AND featured_not_in_gallery=0
         THEN 1 ELSE 0 END media_ready,
         CASE WHEN COALESCE(inventory_tracking,0)=1 AND COALESCE(inventory_quantity,0)<=0 THEN 1 ELSE 0 END tracked_zero_stock,
         CASE WHEN buyer_blocked=1
           OR (COALESCE(inventory_tracking,0)=1 AND COALESCE(inventory_quantity,0)<=0)
           OR publicly_visible=0
           OR NOT (TRIM(COALESCE(featured_image_url,''))<>'' AND image_count>=3 AND alt_attention=0 AND role_attention=0 AND image_source_attention=0 AND featured_not_in_gallery=0)
           OR missing_inventory_matches>0 OR inactive_inventory_links>0 OR unknown_cost_links>0
         THEN 1 ELSE 0 END review_required
  FROM product_evidence
),
launch_metrics AS (
  SELECT
    COUNT(*) products_reviewed,
    SUM(CASE WHEN externally_blocked=0 AND review_required=0 THEN 1 ELSE 0 END) ready_products,
    SUM(CASE WHEN externally_blocked=0 AND review_required=1 THEN 1 ELSE 0 END) review_required_products,
    SUM(externally_blocked) externally_blocked_products,
    SUM(publicly_visible) publicly_visible_products,
    SUM(media_ready) media_ready_products,
    SUM(CASE WHEN media_ready=0 THEN 1 ELSE 0 END) media_blocked_products,
    SUM(tracked_zero_stock) tracked_zero_stock_products,
    SUM(CASE WHEN linked_resource_count>0 THEN 1 ELSE 0 END) products_with_linked_resources,
    SUM(CASE WHEN missing_inventory_matches>0 THEN 1 ELSE 0 END) products_with_missing_linked_inventory,
    SUM(CASE WHEN unknown_cost_links>0 THEN 1 ELSE 0 END) products_with_unknown_linked_cost,
    SUM(buyer_blocked) buyer_blocked_products
  FROM classified_products
),
public_profile_process_keys AS (
  SELECT DISTINCT CAST(j.value AS TEXT) process_key
  FROM workshop_capability_profiles p,
       json_each(CASE WHEN json_valid(p.related_process_keys_json) THEN p.related_process_keys_json ELSE '[]' END) j
  WHERE p.is_public=1 AND p.review_status IN ('reviewed','published') AND TRIM(CAST(j.value AS TEXT))<>''
),
triage_route_counts AS (
  SELECT custom_request_id,COUNT(*) route_count
  FROM custom_request_route_processes
  GROUP BY custom_request_id
),
cost_project_stats AS (
  SELECT creative_work_project_id,
         COUNT(*) active_rows,
         SUM(CASE WHEN cost_evidence_state='reviewed' THEN 1 ELSE 0 END) reviewed_rows,
         SUM(
           CASE WHEN consumables_cost_cents IS NOT NULL THEN 1 ELSE 0 END +
           CASE WHEN packaging_cost_cents IS NOT NULL THEN 1 ELSE 0 END +
           CASE WHEN prototype_waste_cost_cents IS NOT NULL THEN 1 ELSE 0 END +
           CASE WHEN rework_cost_cents IS NOT NULL THEN 1 ELSE 0 END +
           CASE WHEN finishing_cost_cents IS NOT NULL THEN 1 ELSE 0 END +
           CASE WHEN outside_service_cost_cents IS NOT NULL THEN 1 ELSE 0 END
         ) known_direct_components
  FROM creative_project_production_cost_evidence
  WHERE evidence_status='active'
  GROUP BY creative_work_project_id
),
published_project_stories AS (
  SELECT pub.content_publication_id,CAST(cp.source_id AS INTEGER) creative_work_project_id
  FROM content_publications pub
  JOIN content_projects cp ON cp.content_project_id=pub.content_project_id
  WHERE pub.destination='workshop_journal'
    AND pub.content_status='published'
    AND cp.source_type='creative_work_project'
    AND CAST(cp.source_id AS INTEGER)>0
)
SELECT
  lm.*,
  (SELECT COUNT(*) FROM d1_migrations) canonical_migrations,
  (SELECT COUNT(*) FROM pragma_foreign_key_check) foreign_key_violations,
  (SELECT COUNT(*) FROM inventory_processes WHERE COALESCE(is_active,1)=1) canonical_active_processes,
  (SELECT COUNT(*) FROM workshop_capability_profiles WHERE is_public=1 AND review_status IN ('reviewed','published')) public_reviewed_capability_profiles,
  (SELECT COUNT(*) FROM public_profile_process_keys) public_profile_process_keys,
  (SELECT COUNT(*) FROM inventory_processes ip WHERE COALESCE(ip.is_active,1)=1 AND EXISTS (SELECT 1 FROM public_profile_process_keys ppk WHERE ppk.process_key=ip.process_key)) active_processes_with_public_profile,
  (SELECT COUNT(*) FROM custom_requests WHERE COALESCE(status,'new')<>'archived') active_custom_requests,
  (SELECT COUNT(DISTINCT custom_request_id) FROM custom_request_manufacturing_triage) custom_requests_with_triage,
  (SELECT COUNT(*) FROM custom_request_manufacturing_triage t
    LEFT JOIN triage_route_counts rc ON rc.custom_request_id=t.custom_request_id
    WHERE t.triage_status='reviewed'
      AND t.feasibility_state<>'needs_review'
      AND (t.feasibility_state='not_feasible' OR COALESCE(rc.route_count,0)>0)
  ) custom_requests_with_sufficient_triage,
  (SELECT COUNT(*) FROM (
    SELECT creative_work_project_id
    FROM creative_project_operations
    WHERE COALESCE(plan_status,'planned')<>'retired'
    GROUP BY creative_work_project_id
    HAVING COUNT(DISTINCT inventory_process_id)>=2
  )) hybrid_projects,
  (SELECT COUNT(*) FROM custom_request_proof_versions) proof_versions_total,
  (SELECT COUNT(*) FROM custom_request_proof_versions WHERE sent_at IS NOT NULL) proofs_sent,
  (SELECT COUNT(*) FROM custom_request_proof_versions WHERE approved_at IS NOT NULL OR proof_status='approved') proofs_approved,
  (SELECT COUNT(*) FROM custom_request_proof_versions WHERE changes_requested_at IS NOT NULL OR proof_status='changes_requested') proofs_changed,
  (SELECT COUNT(*) FROM creative_project_manufacturing_lifecycles) manufacturing_lifecycles,
  (SELECT COUNT(DISTINCT creative_project_manufacturing_lifecycle_id) FROM creative_project_manufacturing_lifecycle_events WHERE to_stage IN ('prototype','prototype_failed_rework')) lifecycles_with_prototype_evidence,
  (SELECT COUNT(*) FROM creative_project_manufacturing_lifecycles WHERE approved_sample_at IS NOT NULL OR current_stage IN ('approved_sample','production_authorized','production_run','qa_rework','completed')) lifecycles_with_approved_sample,
  (SELECT COUNT(*) FROM creative_project_production_runs WHERE run_status='reviewed') reviewed_production_runs,
  (SELECT COUNT(*) FROM creative_project_manufacturing_lifecycles WHERE current_stage='completed') completed_manufacturing_lifecycles,
  (SELECT COUNT(*) FROM custom_request_quote_drafts) quote_drafts_total,
  (SELECT COUNT(DISTINCT quote_draft_id)
     FROM custom_request_quote_revisions
    WHERE revision_type='build218_margin_review'
      AND (
        json_extract(CASE WHEN json_valid(snapshot_json) THEN snapshot_json ELSE '{}' END,'$.expected_production_cost_cents') IS NOT NULL
        OR json_extract(CASE WHEN json_valid(snapshot_json) THEN snapshot_json ELSE '{}' END,'$.expected_unit_cost_cents') IS NOT NULL
      )
  ) quote_drafts_with_expected_cost_review,
  (SELECT COUNT(*) FROM cost_project_stats) projects_with_actual_cost_evidence,
  (SELECT COUNT(*) FROM cost_project_stats WHERE active_rows>0 AND reviewed_rows=active_rows) projects_with_fully_reviewed_cost_evidence,
  (SELECT COUNT(*) FROM cost_project_stats WHERE active_rows>0 AND reviewed_rows=active_rows AND known_direct_components>0) projects_with_reviewed_known_direct_cost,
  (SELECT COUNT(*) FROM creative_project_production_run_qa_checks) production_run_qa_checks,
  (SELECT COUNT(*) FROM creative_project_production_run_qa_checks WHERE qa_status='pass') qa_pass_checks,
  (SELECT COUNT(*) FROM creative_project_production_run_qa_checks WHERE qa_status='rework') qa_rework_checks,
  (SELECT COUNT(*) FROM creative_project_production_run_qa_checks WHERE qa_status='fail') qa_fail_checks,
  (SELECT COUNT(*) FROM creative_project_production_runs WHERE run_status='reviewed' AND rework_quantity>0) reviewed_runs_with_rework,
  (SELECT COUNT(*) FROM creative_project_production_runs WHERE run_status='reviewed' AND scrap_quantity>0) reviewed_runs_with_scrap,
  (SELECT COALESCE(SUM(rework_quantity),0) FROM creative_project_production_runs WHERE run_status='reviewed') reviewed_rework_quantity,
  (SELECT COALESCE(SUM(scrap_quantity),0) FROM creative_project_production_runs WHERE run_status='reviewed') reviewed_scrap_quantity,
  (SELECT COUNT(*) FROM workshop_knowledge_entries) knowledge_entries_total,
  (SELECT COUNT(*) FROM workshop_knowledge_entries WHERE review_status='reviewed') knowledge_entries_reviewed,
  (SELECT COUNT(*) FROM workshop_knowledge_recipe_versions WHERE recipe_state='approved') approved_recipe_versions,
  (SELECT COUNT(*) FROM content_publications WHERE destination='workshop_journal' AND content_status='published') published_workshop_journal_entries,
  (SELECT COUNT(*) FROM published_project_stories) published_project_case_studies,
  (SELECT COUNT(*) FROM published_project_stories pps WHERE EXISTS (
     SELECT 1
     FROM creative_project_operations o
     JOIN inventory_processes ip ON ip.inventory_process_id=o.inventory_process_id
     JOIN public_profile_process_keys ppk ON ppk.process_key=ip.process_key
     WHERE o.creative_work_project_id=pps.creative_work_project_id
       AND COALESCE(o.plan_status,'planned')<>'retired'
   )) published_capability_backed_case_studies,
  (SELECT COUNT(*) FROM published_project_stories pps WHERE (
     SELECT COUNT(DISTINCT o.inventory_process_id)
     FROM creative_project_operations o
     WHERE o.creative_work_project_id=pps.creative_work_project_id
       AND COALESCE(o.plan_status,'planned')<>'retired'
   )>=2) published_hybrid_case_studies
FROM launch_metrics lm;
