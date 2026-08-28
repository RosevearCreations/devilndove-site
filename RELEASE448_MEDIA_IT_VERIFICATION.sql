-- Release 448 read-only verification for media quality, Movie metadata review and I.T. integration registry.
SELECT COUNT(*) AS required_table_count FROM sqlite_master WHERE type='table' AND name IN ('product_image_quality_assessments','movie_metadata_reviews','it_integration_registry');
SELECT COUNT(*) AS movie_count FROM movies;
SELECT COUNT(*) AS movie_review_count FROM movie_metadata_reviews;
SELECT COUNT(*) AS invalid_image_scores FROM product_image_quality_assessments WHERE total_score<0 OR total_score>100;
SELECT COUNT(*) AS suspicious_credential_references FROM it_integration_registry WHERE credential_reference IS NOT NULL AND (instr(lower(credential_reference),'secret=')>0 OR instr(lower(credential_reference),'token=')>0);
PRAGMA foreign_key_check;
