-- Release 467 Build 234 — Cupcake Soap 2-inch editable label templates.
-- Reference-data only: no Product, Inventory, order, Finance, customer, provider or publication mutation.
-- These compact 50.8 mm × 50.8 mm front labels remain review-first. Full cosmetic declarations may require a companion/back label.

INSERT OR IGNORE INTO packaging_templates
(template_key,template_name,package_type,description,page_width_mm,page_height_mm,front_width_mm,front_height_mm,rear_width_mm,rear_height_mm,layout_json,theme_json,is_system,is_active,created_by_user_id,created_at,updated_at)
VALUES
('cupcake-soap-sweet-orange-2in-v1','Cupcake Soap — Sweet Orange — 2 in','product_label','Editable 2 × 2 inch Cupcake Soap front label inspired by the owner-supplied Sweet Orange reference.',50.8,50.8,50.8,50.8,0,0,
 '{"shape":"rectangle","design_profile":"cupcake_soap_square_v1","safe_margin_mm":2,"bleed_mm":0,"cupcake_preset_key":"sweet-orange","default_collection":"Sweet Orange","default_primary_text":"Cupcake Soap","default_cupcake_purpose_text":"uplifting hand & body soap"}',
 '{"theme_colour":"#FFF4DF","border_colour":"#7A2512","accent_gold":"#F3A21A","secondary_colour":"#F2662D","rose_colour":"#F28A35"}',1,1,NULL,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('cupcake-soap-charcoal-2in-v1','Cupcake Soap — Charcoal — 2 in','product_label','Editable 2 × 2 inch Cupcake Soap front label inspired by the owner-supplied Charcoal reference.',50.8,50.8,50.8,50.8,0,0,
 '{"shape":"rectangle","design_profile":"cupcake_soap_square_v1","safe_margin_mm":2,"bleed_mm":0,"cupcake_preset_key":"charcoal","default_collection":"Charcoal","default_primary_text":"Cupcake Soap","default_cupcake_purpose_text":"deep-cleansing hand & body soap"}',
 '{"theme_colour":"#F3F0E9","border_colour":"#181818","accent_gold":"#BFC3C8","secondary_colour":"#353535","rose_colour":"#555555"}',1,1,NULL,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('cupcake-soap-oatmeal-goat-milk-2in-v1','Cupcake Soap — Oatmeal & Goat Milk — 2 in','product_label','Editable 2 × 2 inch Cupcake Soap front label inspired by the owner-supplied Oatmeal & Goat Milk reference.',50.8,50.8,50.8,50.8,0,0,
 '{"shape":"rectangle","design_profile":"cupcake_soap_square_v1","safe_margin_mm":2,"bleed_mm":0,"cupcake_preset_key":"oatmeal-goat-milk","default_collection":"Oatmeal & Goat Milk","default_primary_text":"Cupcake Soap","default_cupcake_purpose_text":"gentle hand & body soap"}',
 '{"theme_colour":"#FFF3D8","border_colour":"#5A2D10","accent_gold":"#B8894E","secondary_colour":"#A66B35","rose_colour":"#C9B18A"}',1,1,NULL,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('cupcake-soap-sea-breeze-2in-v1','Cupcake Soap — Sea Breeze — 2 in','product_label','Editable 2 × 2 inch Cupcake Soap front label inspired by the owner-supplied Sea Breeze reference.',50.8,50.8,50.8,50.8,0,0,
 '{"shape":"rectangle","design_profile":"cupcake_soap_square_v1","safe_margin_mm":2,"bleed_mm":0,"cupcake_preset_key":"sea-breeze","default_collection":"Sea Breeze","default_primary_text":"Cupcake Soap","default_cupcake_purpose_text":"refreshing hand & body soap"}',
 '{"theme_colour":"#ECFBF7","border_colour":"#083B57","accent_gold":"#B99B5B","secondary_colour":"#1598A5","rose_colour":"#55C9C2"}',1,1,NULL,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('cupcake-soap-lavender-dream-2in-v1','Cupcake Soap — Lavender Dream — 2 in','product_label','Editable 2 × 2 inch Cupcake Soap front label inspired by the owner-supplied Lavender Dream reference.',50.8,50.8,50.8,50.8,0,0,
 '{"shape":"rectangle","design_profile":"cupcake_soap_square_v1","safe_margin_mm":2,"bleed_mm":0,"cupcake_preset_key":"lavender-dream","default_collection":"Lavender Dream","default_primary_text":"Cupcake Soap","default_cupcake_purpose_text":"calming hand & body soap"}',
 '{"theme_colour":"#FFF5E9","border_colour":"#3E1759","accent_gold":"#C79A46","secondary_colour":"#8757B2","rose_colour":"#A57BCB"}',1,1,NULL,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('cupcake-soap-rose-petal-2in-v1','Cupcake Soap — Rose Petal — 2 in','product_label','Editable 2 × 2 inch Cupcake Soap colour variant.',50.8,50.8,50.8,50.8,0,0,
 '{"shape":"rectangle","design_profile":"cupcake_soap_square_v1","safe_margin_mm":2,"bleed_mm":0,"cupcake_preset_key":"rose-petal","default_collection":"Rose Petal","default_primary_text":"Cupcake Soap","default_cupcake_purpose_text":"floral hand & body soap"}',
 '{"theme_colour":"#FFF0F2","border_colour":"#681C36","accent_gold":"#C99760","secondary_colour":"#D86B8A","rose_colour":"#E18CA4"}',1,1,NULL,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('cupcake-soap-lemon-honey-2in-v1','Cupcake Soap — Lemon Honey — 2 in','product_label','Editable 2 × 2 inch Cupcake Soap colour variant.',50.8,50.8,50.8,50.8,0,0,
 '{"shape":"rectangle","design_profile":"cupcake_soap_square_v1","safe_margin_mm":2,"bleed_mm":0,"cupcake_preset_key":"lemon-honey","default_collection":"Lemon Honey","default_primary_text":"Cupcake Soap","default_cupcake_purpose_text":"bright hand & body soap"}',
 '{"theme_colour":"#FFF9DE","border_colour":"#6E4A0C","accent_gold":"#D5A928","secondary_colour":"#E8C43B","rose_colour":"#E0B12A"}',1,1,NULL,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('cupcake-soap-eucalyptus-mint-2in-v1','Cupcake Soap — Eucalyptus Mint — 2 in','product_label','Editable 2 × 2 inch Cupcake Soap colour variant.',50.8,50.8,50.8,50.8,0,0,
 '{"shape":"rectangle","design_profile":"cupcake_soap_square_v1","safe_margin_mm":2,"bleed_mm":0,"cupcake_preset_key":"eucalyptus-mint","default_collection":"Eucalyptus Mint","default_primary_text":"Cupcake Soap","default_cupcake_purpose_text":"fresh hand & body soap"}',
 '{"theme_colour":"#F1FAF2","border_colour":"#174A32","accent_gold":"#A5A66A","secondary_colour":"#5BA87D","rose_colour":"#77B995"}',1,1,NULL,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('cupcake-soap-vanilla-cream-2in-v1','Cupcake Soap — Vanilla Cream — 2 in','product_label','Editable 2 × 2 inch Cupcake Soap colour variant.',50.8,50.8,50.8,50.8,0,0,
 '{"shape":"rectangle","design_profile":"cupcake_soap_square_v1","safe_margin_mm":2,"bleed_mm":0,"cupcake_preset_key":"vanilla-cream","default_collection":"Vanilla Cream","default_primary_text":"Cupcake Soap","default_cupcake_purpose_text":"creamy hand & body soap"}',
 '{"theme_colour":"#FFF8E9","border_colour":"#5D3822","accent_gold":"#C6A169","secondary_colour":"#C99865","rose_colour":"#D8B98D"}',1,1,NULL,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('cupcake-soap-berry-bliss-2in-v1','Cupcake Soap — Berry Bliss — 2 in','product_label','Editable 2 × 2 inch Cupcake Soap colour variant.',50.8,50.8,50.8,50.8,0,0,
 '{"shape":"rectangle","design_profile":"cupcake_soap_square_v1","safe_margin_mm":2,"bleed_mm":0,"cupcake_preset_key":"berry-bliss","default_collection":"Berry Bliss","default_primary_text":"Cupcake Soap","default_cupcake_purpose_text":"fruity hand & body soap"}',
 '{"theme_colour":"#FFF0F8","border_colour":"#4E174B","accent_gold":"#C59A58","secondary_colour":"#B83E83","rose_colour":"#D865A2"}',1,1,NULL,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
