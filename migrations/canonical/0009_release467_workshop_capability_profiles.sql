-- Release 467 Build 209 — Workshop Capability Profiles & Constraints
-- Additive reviewed public/admin profile authority linked to canonical inventory_processes keys.
-- No machine setting, dimension, material compatibility or service capability is invented by this migration.

CREATE TABLE IF NOT EXISTS workshop_capability_profiles (
  workshop_capability_profile_id INTEGER PRIMARY KEY AUTOINCREMENT,
  capability_key TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  summary TEXT NOT NULL,
  suitable_uses TEXT NOT NULL,
  common_materials TEXT NOT NULL,
  known_constraints TEXT NOT NULL,
  constraints_state TEXT NOT NULL DEFAULT 'unmeasured' CHECK(constraints_state IN ('unmeasured','owner_confirmed','measured','mixed')),
  customer_supplied_policy TEXT NOT NULL DEFAULT 'may_be_assessed' CHECK(customer_supplied_policy IN ('may_be_assessed','not_assessed','not_applicable')),
  proof_sample_policy TEXT NOT NULL DEFAULT 'case_by_case' CHECK(proof_sample_policy IN ('case_by_case','normally_required','normally_not_required','unknown')),
  related_process_keys_json TEXT NOT NULL DEFAULT '[]',
  gallery_query TEXT,
  custom_request_path TEXT NOT NULL DEFAULT '/custom-request/',
  source_note TEXT NOT NULL,
  review_status TEXT NOT NULL DEFAULT 'reviewed' CHECK(review_status IN ('draft','reviewed','published','hold')),
  is_public INTEGER NOT NULL DEFAULT 1 CHECK(is_public IN (0,1)),
  reviewed_by_user_id INTEGER,
  reviewed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_workshop_capability_profiles_public
  ON workshop_capability_profiles(is_public,review_status,display_name);

INSERT OR IGNORE INTO workshop_capability_profiles(
  capability_key,display_name,summary,suitable_uses,common_materials,known_constraints,constraints_state,
  customer_supplied_policy,proof_sample_policy,related_process_keys_json,gallery_query,custom_request_path,source_note,review_status,is_public
) VALUES(
 'laser-engraving','Laser Engraving & Cutting','Reviewed laser capability for engraving, cutting and personalized workshop components where the exact material and job have been assessed.','Personalized gifts, engraved components, labels, signs and cut workshop pieces when the job is supported by current material and process evidence.','Blanks, masking and engraving/cutting materials only when the specific material is documented for the project.','Maximum work area, thickness, power, speed, material compatibility and finish limits are not published because they have not been measured in this profile. Each job requires review.','unmeasured',
 'may_be_assessed','case_by_case','["laser-engraving"]','laser','/custom-request/','Build 207 canonical laser-engraving process plus the owner-confirmed manufacturing-era workshop roadmap.','reviewed',1
);
INSERT OR IGNORE INTO workshop_capability_profiles(
  capability_key,display_name,summary,suitable_uses,common_materials,known_constraints,constraints_state,
  customer_supplied_policy,proof_sample_policy,related_process_keys_json,gallery_query,custom_request_path,source_note,review_status,is_public
) VALUES(
 'cricut-vinyl-htv','Cricut, Vinyl & HTV','Digital-cutting and transfer capability for adhesive vinyl, heat-transfer vinyl and related personalization work.','Lettering, graphics, stencils, transfer work and personalized apparel/hat or other reviewed blanks.','Adhesive vinyl, heat-transfer vinyl, transfer media and reviewed compatible blanks.','Cut dimensions, press settings, adhesive/HTV compatibility, fabric/blanks and durability are project-specific and are not generalized here.','unmeasured',
 'may_be_assessed','case_by_case','["cricut-vinyl-htv","apparel-hat-finishing","drinkware-personalization"]','vinyl','/custom-request/','Build 207 canonical Cricut/vinyl/HTV, apparel/hat and drinkware process descriptions plus the owner-confirmed workshop roadmap.','reviewed',1
);
INSERT OR IGNORE INTO workshop_capability_profiles(
  capability_key,display_name,summary,suitable_uses,common_materials,known_constraints,constraints_state,
  customer_supplied_policy,proof_sample_policy,related_process_keys_json,gallery_query,custom_request_path,source_note,review_status,is_public
) VALUES(
 'resin','Resin Casting & Finishing','UV/epoxy resin capability for decorative, mixed-media and small workshop projects where cure, mold and finish requirements are reviewed.','Cast or filled decorative pieces, layered accents, coatings and hybrid workshop projects supported by current project evidence.','UV/epoxy resin, molds, pigments and other inclusions or substrates only when documented as compatible for the project.','Cure schedule, pour depth, mold size, substrate compatibility, heat/UV exposure and final-use limitations are not generalized; they require project-specific review.','unmeasured',
 'may_be_assessed','case_by_case','["resin","mixed-media-hybrid"]','resin','/custom-request/','Build 207 canonical resin and mixed-media process descriptions plus the owner-confirmed workshop roadmap.','reviewed',1
);
INSERT OR IGNORE INTO workshop_capability_profiles(
  capability_key,display_name,summary,suitable_uses,common_materials,known_constraints,constraints_state,
  customer_supplied_policy,proof_sample_policy,related_process_keys_json,gallery_query,custom_request_path,source_note,review_status,is_public
) VALUES(
 '3d-printing','3D Printing','3D-printing capability for prototypes, fixtures, creative objects and components using documented printer/material combinations.','Prototypes, small creative objects, workshop fixtures and components that fit a reviewed design and printer/material plan.','Filament or resin and printer-specific build materials only where the actual printer/material combination is documented.','Build volume, layer settings, tolerances, strength, temperature resistance and material choices are not published as universal limits; they remain project-specific.','unmeasured',
 'may_be_assessed','case_by_case','["3d-printing"]','3D','/custom-request/','Build 207 canonical 3D-printing process description plus the owner-confirmed workshop roadmap.','reviewed',1
);
INSERT OR IGNORE INTO workshop_capability_profiles(
  capability_key,display_name,summary,suitable_uses,common_materials,known_constraints,constraints_state,
  customer_supplied_policy,proof_sample_policy,related_process_keys_json,gallery_query,custom_request_path,source_note,review_status,is_public
) VALUES(
 'cnc-machining','CNC Machining','CNC capability for routed or machined workshop components where workholding, cutter and material suitability are reviewed.','Custom workshop components, routed/machined details, fixtures and hybrid project parts supported by an approved plan.','Project workpiece materials are reviewed case by case; the current profile does not publish a universal material-compatibility list.','Machine envelope, cutter reach, feeds/speeds, achievable tolerance, workholding and material limits have not been measured into this profile.','unmeasured',
 'may_be_assessed','case_by_case','["cnc-machining"]','CNC','/custom-request/','Build 207 canonical CNC process description plus the owner-confirmed workshop roadmap.','reviewed',1
);
INSERT OR IGNORE INTO workshop_capability_profiles(
  capability_key,display_name,summary,suitable_uses,common_materials,known_constraints,constraints_state,
  customer_supplied_policy,proof_sample_policy,related_process_keys_json,gallery_query,custom_request_path,source_note,review_status,is_public
) VALUES(
 'metal-lathe','Metal & Lathe Work','Metal-forming and lathe capability for reviewed small workshop parts, ring-related work and hybrid fabrication.','Turned or formed workshop components, ring-related parts, fixtures and hybrid metal projects where the exact stock and operation are reviewed.','Metal stock and related tooling/workholding only where the material and operation are identified for the project.','Lathe swing, between-centres length, spindle capacity, tolerances, material grades and heat-treatment limits are not recorded in this profile and must not be assumed.','unmeasured',
 'may_be_assessed','case_by_case','["metal-lathe","metal-ring-work","forging-heat-work","soldering"]','metal','/custom-request/','Build 207 canonical metal-lathe, metal/ring, forging/heat-work and soldering process descriptions plus the owner-confirmed workshop roadmap.','reviewed',1
);
INSERT OR IGNORE INTO workshop_capability_profiles(
  capability_key,display_name,summary,suitable_uses,common_materials,known_constraints,constraints_state,
  customer_supplied_policy,proof_sample_policy,related_process_keys_json,gallery_query,custom_request_path,source_note,review_status,is_public
) VALUES(
 'jewelry','Jewelry & Ring Work','Jewelry capability spanning ring forming, wire wrapping, soldering, polymer-clay accents and stone-related work where supported by project evidence.','Coin/spoon rings, wire-wrapped work, polymer-clay jewelry, stone accents and other reviewed one-off or small-batch jewelry projects.','Documented coin/spoon metals, wire, polymer clay, stones/minerals and joining/finishing supplies as applicable to the specific project.','Metal composition, stone suitability, ring sizing range, allergy/sensitivity, solder compatibility and finish durability are reviewed per piece; no universal limits are claimed.','unmeasured',
 'may_be_assessed','case_by_case','["metal-ring-work","wire-wrapping","soldering","polymer-clay","lapidary"]','ring','/custom-request/','Build 207 canonical jewelry-related process descriptions plus the owner-confirmed workshop roadmap.','reviewed',1
);
INSERT OR IGNORE INTO workshop_capability_profiles(
  capability_key,display_name,summary,suitable_uses,common_materials,known_constraints,constraints_state,
  customer_supplied_policy,proof_sample_policy,related_process_keys_json,gallery_query,custom_request_path,source_note,review_status,is_public
) VALUES(
 'paracord','Paracord','Paracord and cordage capability for jewelry, braided/knot projects and reviewed maker applications.','Bracelets, jewelry, decorative cordage, knots/braids and project-specific utility pieces where hardware and intended use are reviewed.','Paracord or other documented cordage, buckles and project hardware.','Load rating, safety-critical use, hardware strength, outdoor durability and size limits are not generalized; intended use must be reviewed before acceptance.','unmeasured',
 'may_be_assessed','case_by_case','["paracord"]','paracord','/custom-request/','Build 207 canonical paracord process description plus the owner-confirmed workshop roadmap.','reviewed',1
);
INSERT OR IGNORE INTO workshop_capability_profiles(
  capability_key,display_name,summary,suitable_uses,common_materials,known_constraints,constraints_state,
  customer_supplied_policy,proof_sample_policy,related_process_keys_json,gallery_query,custom_request_path,source_note,review_status,is_public
) VALUES(
 'lapidary','Lapidary','Stone cutting, grinding and polishing capability for reviewed stones/minerals and jewelry or mixed-media projects.','Stone shaping, grinding, polishing, cabochon-style preparation and project-specific stone accents.','Stone or mineral workpieces and lapidary consumables only where the material is identified and considered suitable for the planned operation.','Stone identity, fracture risk, dust/wet-work requirements, maximum dimensions and achievable finish vary by material and are not generalized here.','unmeasured',
 'may_be_assessed','case_by_case','["lapidary"]','stone','/custom-request/','Build 207 canonical lapidary process description plus the owner-confirmed workshop roadmap.','reviewed',1
);
INSERT OR IGNORE INTO workshop_capability_profiles(
  capability_key,display_name,summary,suitable_uses,common_materials,known_constraints,constraints_state,
  customer_supplied_policy,proof_sample_policy,related_process_keys_json,gallery_query,custom_request_path,source_note,review_status,is_public
) VALUES(
 'candles-soap','Candles, Soap & Bath/Body','Small-batch candle and soap/bath-body capability using reviewed formulas, ingredients, packaging and applicable compliance evidence.','Reviewed candles, soap bars, bath/body items and gift sets where formula, ingredient, label and production evidence are sufficient.','Wax, fragrance, colour, vessels; soap/bath-body bases, molds, additives and fragrance/essential-oil handling materials where documented.','Formula safety, ingredient suitability, cure/testing, claims, labeling and regulatory requirements are product-specific. This profile is not a blanket cosmetic-safety or performance claim.','mixed',
 'not_assessed','case_by_case','["candles","soap-bath-body","packaging-labeling"]','candle','/custom-request/','Build 207 canonical candle, soap/bath-body and packaging process descriptions; applicable product evidence remains required before sale.','reviewed',1
);
INSERT OR IGNORE INTO workshop_capability_profiles(
  capability_key,display_name,summary,suitable_uses,common_materials,known_constraints,constraints_state,
  customer_supplied_policy,proof_sample_policy,related_process_keys_json,gallery_query,custom_request_path,source_note,review_status,is_public
) VALUES(
 'packaging-labeling','Packaging & Labeling','Packaging, label and finishing capability that reuses the existing Packaging Studio for reviewed layouts, BOMs, proofs and physical-output evidence.','Labels, packaging layouts, product presentation, print/cut/engraved packaging components and repeatable packaging jobs.','Packaging components, labels, printing media and finishing materials documented by the Packaging Studio or the specific job.','Printer/laser compatibility, media size, bleed, colour, cut and physical-output settings remain evidence-dependent. A layout preview is not proof of final physical output.','mixed',
 'may_be_assessed','normally_required','["packaging-labeling","cricut-vinyl-htv","laser-engraving"]','label','/custom-request/','Build 207 packaging process plus the existing Packaging Studio proof/version and physical-output authority.','reviewed',1
);
INSERT OR IGNORE INTO workshop_capability_profiles(
  capability_key,display_name,summary,suitable_uses,common_materials,known_constraints,constraints_state,
  customer_supplied_policy,proof_sample_policy,related_process_keys_json,gallery_query,custom_request_path,source_note,review_status,is_public
) VALUES(
 'mechanical-automotive-fabrication','Mechanical & Automotive Fabrication','Workshop mechanical and automotive-fabrication capability for reviewed fabrication, fixtures, adaptation and maker projects.','Fabrication, fixtures, brackets, project adaptation and other workshop mechanical work that fits documented skills, tooling and a reviewed scope.','Project-specific workshop materials, fasteners, fixtures and components only after the exact item and operation are reviewed.','This is not a general automotive repair, diagnosis, inspection or safety-critical service promise. Vehicle/item condition, dimensions, material compatibility, load/safety implications and legal requirements require case-by-case review.','mixed',
 'may_be_assessed','case_by_case','["mechanical-automotive-fabrication","metal-lathe","soldering","forging-heat-work","general-workshop"]','mechanical','/custom-request/','Build 207 canonical mechanical/automotive-fabrication boundary plus the owner-confirmed workshop roadmap.','reviewed',1
);
