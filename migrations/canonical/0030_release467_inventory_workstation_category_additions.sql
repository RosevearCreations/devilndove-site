-- Release 467 Build 359 — Inventory workstation/category additions.
-- Forward-only reference-data extension of the canonical inventory_processes authority.
-- Adds operator-requested umbrella categories without changing existing assignments.

INSERT OR IGNORE INTO inventory_processes(process_key,process_name,description,sort_order) VALUES
  ('jewelry-forge-work','Jewelry & Forge Work','Jewelry making, ring work, forming, forging, soldering, finishing and related metalworking tools and supplies.',72),
  ('auto-detailing','Auto Detailing','Vehicle detailing tools, wash/decontamination supplies, polishing equipment, interior-care products and related detailing consumables.',132);

UPDATE inventory_processes
SET process_name='Jewelry & Forge Work',
    description='Jewelry making, ring work, forming, forging, soldering, finishing and related metalworking tools and supplies.',
    is_active=1,
    sort_order=72,
    updated_at=CURRENT_TIMESTAMP
WHERE process_key='jewelry-forge-work';

UPDATE inventory_processes
SET process_name='Auto Detailing',
    description='Vehicle detailing tools, wash/decontamination supplies, polishing equipment, interior-care products and related detailing consumables.',
    is_active=1,
    sort_order=132,
    updated_at=CURRENT_TIMESTAMP
WHERE process_key='auto-detailing';
