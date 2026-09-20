-- Release 467 Build 207 — Workshop Capability & Process Taxonomy Expansion
-- Forward-only reference-taxonomy expansion of the Build 156 inventory_processes authority.
-- Existing process keys and reviewed Tool/Supply assignments are preserved; no assignment is created automatically.

UPDATE inventory_processes
SET process_name='Laser Engraving & Cutting',
    description='Laser engraving/cutting equipment, ventilation, blanks, masking and process supplies.',
    sort_order=10,
    updated_at=CURRENT_TIMESTAMP
WHERE process_key='laser-engraving';

UPDATE inventory_processes
SET description='Coin/spoon ring forming, shaping, polishing and related metal/ring work equipment and supplies.',
    sort_order=70,
    updated_at=CURRENT_TIMESTAMP
WHERE process_key='metal-ring-work';

UPDATE inventory_processes
SET sort_order=120, updated_at=CURRENT_TIMESTAMP
WHERE process_key='packaging-labeling';

UPDATE inventory_processes
SET sort_order=140, updated_at=CURRENT_TIMESTAMP
WHERE process_key='photography-content';

INSERT OR IGNORE INTO inventory_processes(process_key,process_name,description,sort_order) VALUES
 ('soap-bath-body','Soap & Bath/Body','Soap, bath/body bases, molds, additives, fragrance/essential-oil handling and finishing supplies.',65),
 ('paracord','Paracord','Paracord, cordage, buckles, jigs and knotting/braiding tools for jewelry and maker work.',85),
 ('forging-heat-work','Forging & Heat Work','Forge, torch, heat-forming, annealing and related hot-work tools and supplies.',105),
 ('metal-lathe','Metal Lathe','Metal-lathe tooling, workholding, cutting, turning and finishing supplies.',107),
 ('cricut-vinyl-htv','Cricut, Vinyl & HTV','Cricut/digital-cutting, adhesive vinyl, heat-transfer vinyl, transfer media and related tools.',115),
 ('apparel-hat-finishing','Apparel & Hat Finishing','Apparel, hat, press/finishing blanks and tools used for customized wearable work.',116),
 ('drinkware-personalization','Drinkware Personalization','Cups, mugs, tumblers and related personalization blanks, fixtures and finishing supplies.',117),
 ('mechanical-automotive-fabrication','Mechanical & Automotive Fabrication','Workshop mechanical/automotive fabrication tools, fixtures, materials and finishing supplies; not a general repair-service promise.',130),
 ('mixed-media-hybrid','Mixed-Media & Hybrid','Cross-discipline projects combining two or more canonical workshop processes.',150);

UPDATE inventory_processes
SET updated_at=CURRENT_TIMESTAMP
WHERE process_key IN (
 '3d-printing','cnc-machining','resin','polymer-clay','candles','wire-wrapping','lapidary','soldering','general-workshop'
);
