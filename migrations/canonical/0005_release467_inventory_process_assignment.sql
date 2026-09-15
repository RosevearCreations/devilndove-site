-- Release 467 Build 156 — Tool & Supply Process Assignment
-- Forward-only, additive authority for assigning each active Tool/Supply inventory item to one workshop process.

CREATE TABLE IF NOT EXISTS inventory_processes (
  inventory_process_id INTEGER PRIMARY KEY AUTOINCREMENT,
  process_key TEXT NOT NULL UNIQUE,
  process_name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 100,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0,1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inventory_process_assignments (
  site_item_inventory_id INTEGER PRIMARY KEY,
  inventory_process_id INTEGER NOT NULL,
  assigned_by_user_id INTEGER,
  assigned_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(site_item_inventory_id) REFERENCES site_item_inventory(site_item_inventory_id) ON DELETE CASCADE,
  FOREIGN KEY(inventory_process_id) REFERENCES inventory_processes(inventory_process_id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_inventory_processes_active_sort
  ON inventory_processes(is_active, sort_order, process_name);
CREATE INDEX IF NOT EXISTS idx_inventory_process_assignments_process
  ON inventory_process_assignments(inventory_process_id, site_item_inventory_id);

INSERT OR IGNORE INTO inventory_processes(process_key,process_name,description,sort_order) VALUES
 ('laser-engraving','Laser Engraving','Laser engravers, ventilation, blanks, masking and engraving supplies.',10),
 ('3d-printing','3D Printing','3D printers, filament/resin, build surfaces and printer-specific equipment.',20),
 ('cnc-machining','CNC Machining','CNC equipment, cutters, workholding and machining supplies.',30),
 ('resin','Resin','UV/epoxy resin equipment, molds, pigments and consumables.',40),
 ('polymer-clay','Polymer Clay','Polymer clay tools, clay, cutters, texture tools and finishing supplies.',50),
 ('candles','Candles','Wax, fragrance, colour, vessels and candle-making equipment.',60),
 ('metal-ring-work','Metal & Ring Work','Coin/spoon ring, forging, forming, polishing and related metalwork equipment.',70),
 ('wire-wrapping','Wire Wrapping','Wire, pliers, mandrels and wrapping tools.',80),
 ('lapidary','Lapidary','Stone cutting, grinding, polishing and lapidary equipment/supplies.',90),
 ('soldering','Soldering','Soldering stations, torches, solder, flux and joining supplies.',100),
 ('packaging-labeling','Packaging & Labeling','Packaging, labels, printing and finishing supplies/equipment.',110),
 ('photography-content','Photography & Content','Photography, video and content-production equipment/supplies.',120),
 ('general-workshop','General Workshop','General-purpose equipment or supplies shared across processes.',900);
